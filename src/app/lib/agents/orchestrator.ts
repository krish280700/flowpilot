import { prisma } from "@/app/lib/prisma";
import { generateProjectPlan } from "./planning-agent";
import { evaluatePlan } from "./evaluation-agent";
import { refinePlan } from "./refinement-agent";
import { analyzeDependencies } from "./dependency-agent";
import { planSprints } from "./sprint-planner-agent";
import { detectRisks } from "./risk-agent";
import { generateDailySummary } from "./summary-agent";

export interface OrchestrationResult {
    success: boolean;
    projectId: string;
    agentResults: {
        planning: { epicsCreated: number; tasksCreated: number };
        evaluation: { score: number; feedback: string[]; refined: boolean };
        dependencies: { dependenciesFound: number; criticalPathLength: number };
        sprints: { sprintsCreated: number };
        risks: { risksDetected: number };
        summary: string;
    };
    totalDurationMs: number;
    error?: string;
}

export async function orchestrateProject(
    projectId: string,
    projectGoal: string
): Promise<OrchestrationResult> {
    const orchestrationStart = Date.now();

    // Log orchestrator start
    const orchestratorLog = await prisma.agentLog.create({
        data: {
            projectId,
            agentName: "Orchestrator",
            agentRole: "Master coordinator — manages the full multi-agent pipeline",
            status: "RUNNING",
            input: `Project: ${projectId} | Goal: ${projectGoal.slice(0, 200)}`,
        },
    });

    const result: OrchestrationResult = {
        success: false,
        projectId,
        agentResults: {
            planning: { epicsCreated: 0, tasksCreated: 0 },
            evaluation: { score: 0, feedback: [], refined: false },
            dependencies: { dependenciesFound: 0, criticalPathLength: 0 },
            sprints: { sprintsCreated: 0 },
            risks: { risksDetected: 0 },
            summary: "",
        },
        totalDurationMs: 0,
    };

    try {
        // ─── STEP 1: Planning Agent ─────────────────────────────────────────
        console.log("[Orchestrator] Step 1: Planning Agent");
        await logAgentStart(projectId, "PlanningAgent", "Initial plan generator — breaks project goal into epics and tasks");

        const plan = await generateProjectPlan({ projectGoal, projectId });

        const epicCount = plan.epics?.length || 0;
        const taskCount = plan.epics?.reduce((a: number, e: any) => a + (e.tasks?.length || 0), 0) || 0;
        result.agentResults.planning = { epicsCreated: epicCount, tasksCreated: taskCount };

        // ─── STEP 2: Evaluation Agent ───────────────────────────────────────
        console.log("[Orchestrator] Step 2: Evaluation Agent");
        const evaluation = await evaluatePlan(projectId, projectGoal);
        result.agentResults.evaluation = {
            score: evaluation.overallScore,
            feedback: evaluation.feedback,
            refined: false,
        };

        // ─── STEP 3: Refinement Agent (conditional) ──────────────────────────
        if (evaluation.recommendRefinement) {
            console.log(`[Orchestrator] Step 3: Refinement Agent (score was ${evaluation.overallScore}/10)`);
            await refinePlan(projectId, projectGoal, evaluation);
            result.agentResults.evaluation.refined = true;
        } else {
            console.log(`[Orchestrator] Step 3: Skipping refinement (score ${evaluation.overallScore}/10 ≥ 7)`);
            await prisma.agentLog.create({
                data: {
                    projectId,
                    agentName: "RefinementAgent",
                    agentRole: "Plan improver — fills gaps identified by the evaluation agent",
                    status: "SKIPPED",
                    input: `Plan score: ${evaluation.overallScore}/10 — above threshold, no refinement needed`,
                    output: "Skipped",
                    completedAt: new Date(),
                },
            });
        }

        // ─── STEP 4: Dependency Agent ────────────────────────────────────────
        console.log("[Orchestrator] Step 4: Dependency Agent");
        const dependencyMap = await analyzeDependencies(projectId);
        result.agentResults.dependencies = {
            dependenciesFound: dependencyMap.dependencies?.length || 0,
            criticalPathLength: dependencyMap.criticalPath?.length || 0,
        };

        // ─── STEP 5: Sprint Planner Agent ────────────────────────────────────
        console.log("[Orchestrator] Step 5: Sprint Planner Agent");
        const sprintPlan = await planSprints(projectId, dependencyMap);
        result.agentResults.sprints = {
            sprintsCreated: sprintPlan.sprints?.length || 0,
        };

        // ─── STEP 6: Risk Agent ──────────────────────────────────────────────
        console.log("[Orchestrator] Step 6: Risk Agent");
        const riskResult = await detectRisks(projectId);
        result.agentResults.risks = {
            risksDetected: riskResult.risks?.length || 0,
        };

        // Log risk agent
        await prisma.agentLog.create({
            data: {
                projectId,
                agentName: "RiskAgent",
                agentRole: "Risk detector — identifies blockers, resource constraints and timeline risks",
                status: "COMPLETED",
                output: `Detected ${riskResult.risks?.length || 0} risks`,
                completedAt: new Date(),
            },
        });

        // ─── STEP 7: Summary Agent ───────────────────────────────────────────
        console.log("[Orchestrator] Step 7: Summary Agent");
        const summary = await generateKickoffSummary(projectId, projectGoal, result);
        result.agentResults.summary = summary;

        // Log summary agent
        await prisma.agentLog.create({
            data: {
                projectId,
                agentName: "SummaryAgent",
                agentRole: "Project summarizer — writes the kickoff brief and project overview",
                status: "COMPLETED",
                output: summary.slice(0, 500),
                completedAt: new Date(),
            },
        });

        // Update project description with the kickoff summary
        await prisma.project.update({
            where: { id: projectId },
            data: { description: summary },
        });

        // ─── Complete orchestration ──────────────────────────────────────────
        result.success = true;
        result.totalDurationMs = Date.now() - orchestrationStart;

        await prisma.agentLog.update({
            where: { id: orchestratorLog.id },
            data: {
                status: "COMPLETED",
                output: buildOrchestratorSummary(result),
                durationMs: result.totalDurationMs,
                completedAt: new Date(),
            },
        });

        console.log(`[Orchestrator] Complete in ${result.totalDurationMs}ms`);
        return result;

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.error = errorMsg;
        result.totalDurationMs = Date.now() - orchestrationStart;

        await prisma.agentLog.update({
            where: { id: orchestratorLog.id },
            data: {
                status: "FAILED",
                error: errorMsg,
                durationMs: result.totalDurationMs,
                completedAt: new Date(),
            },
        });

        console.error("[Orchestrator] Failed:", errorMsg);
        throw error;
    }
}

async function generateKickoffSummary(
    projectId: string,
    projectGoal: string,
    result: OrchestrationResult
): Promise<string> {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { agentResults } = result;

    const prompt = `Write a concise project kickoff brief for stakeholders.

PROJECT GOAL: "${projectGoal}"

AI ANALYSIS RESULTS:
- Plan quality score: ${agentResults.evaluation.score.toFixed(1)}/10
- Epics created: ${agentResults.planning.epicsCreated}
- Total tasks: ${agentResults.planning.tasksCreated}
- Sprints planned: ${agentResults.sprints.sprintsCreated}
- Dependencies mapped: ${agentResults.dependencies.dependenciesFound}
- Risks detected: ${agentResults.risks.risksDetected}
- Plan was refined: ${agentResults.evaluation.refined ? "Yes" : "No"}

Write 2-3 paragraphs covering:
1. What this project will build and its primary value
2. How it's been structured (sprints, key milestones)
3. Key risks or items to watch

Keep it professional, concise, and actionable.`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
    });

    return response.choices[0].message.content || "";
}

async function logAgentStart(projectId: string, agentName: string, agentRole: string) {
    return prisma.agentLog.create({
        data: {
            projectId,
            agentName,
            agentRole,
            status: "RUNNING",
        },
    });
}

function buildOrchestratorSummary(result: OrchestrationResult): string {
    const { agentResults } = result;
    return [
        `Pipeline completed in ${(result.totalDurationMs / 1000).toFixed(1)}s`,
        `Planning: ${agentResults.planning.epicsCreated} epics, ${agentResults.planning.tasksCreated} tasks`,
        `Evaluation: ${agentResults.evaluation.score.toFixed(1)}/10 | Refined: ${agentResults.evaluation.refined}`,
        `Dependencies: ${agentResults.dependencies.dependenciesFound} relationships mapped`,
        `Sprints: ${agentResults.sprints.sprintsCreated} sprints created`,
        `Risks: ${agentResults.risks.risksDetected} detected`,
    ].join(" | ");
}
