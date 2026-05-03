import { OpenAI } from "openai";
import { prisma } from "@/app/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface EvaluationResult {
    overallScore: number; // 0-10
    scores: {
        completeness: number;    // Are all needed tasks covered?
        clarity: number;         // Are tasks well-defined and actionable?
        feasibility: number;     // Are estimates realistic?
        technicalCoverage: number; // Are tech concerns addressed?
    };
    feedback: string[];          // Specific improvement suggestions
    missingAreas: string[];      // Topics/areas not covered
    strengths: string[];         // What's done well
    recommendRefinement: boolean; // Whether refinement agent should run
}

export async function evaluatePlan(
    projectId: string,
    projectGoal: string
): Promise<EvaluationResult> {
    // Fetch the generated plan from DB
    const epics = await prisma.epic.findMany({
        where: { projectId },
        include: { tasks: true },
    });

    const planSummary = epics
        .map((epic) => {
            const taskList = epic.tasks
                .map((t) => `    - [${t.priority}] ${t.title} (${t.estimatedHours ?? "?"}h)`)
                .join("\n");
            return `EPIC: ${epic.title}\n${epic.description || ""}\nTasks:\n${taskList}`;
        })
        .join("\n\n");

    const totalTasks = epics.reduce((acc, e) => acc + e.tasks.length, 0);
    const totalHours = epics.reduce(
        (acc, e) => acc + e.tasks.reduce((a, t) => a + (t.estimatedHours ?? 0), 0),
        0
    );

    const prompt = `You are a senior engineering manager evaluating an AI-generated project plan.

PROJECT GOAL:
"${projectGoal}"

GENERATED PLAN (${epics.length} epics, ${totalTasks} tasks, ~${totalHours}h estimated):
${planSummary}

Evaluate this plan on these dimensions (score 0-10 each):
1. completeness - Are all necessary tasks covered for the goal?
2. clarity - Are tasks well-defined, specific, and actionable?
3. feasibility - Are time estimates realistic? Is scope manageable?
4. technicalCoverage - Are technical concerns (auth, error handling, testing, deployment, security) addressed?

Respond ONLY with valid JSON:
{
  "scores": {
    "completeness": 7,
    "clarity": 8,
    "feasibility": 6,
    "technicalCoverage": 5
  },
  "overallScore": 6.5,
  "strengths": ["Clear epic structure", "Good task breakdown"],
  "feedback": ["Missing error handling tasks", "No testing tasks included"],
  "missingAreas": ["Unit testing", "CI/CD setup", "Error monitoring"],
  "recommendRefinement": true
}`;

    const startMs = Date.now();
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
    });

    let content = response.choices[0].message.content || "{}";
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(content) as EvaluationResult;
    parsed.overallScore = parsed.overallScore ??
        Object.values(parsed.scores).reduce((a, b) => a + b, 0) / 4;
    parsed.recommendRefinement = parsed.overallScore < 7;

    // Log to DB
    await prisma.agentLog.create({
        data: {
            projectId,
            agentName: "EvaluationAgent",
            agentRole: "Quality evaluator — scores the generated plan and identifies gaps",
            status: "COMPLETED",
            input: `Goal: ${projectGoal} | Epics: ${epics.length} | Tasks: ${totalTasks}`,
            output: JSON.stringify(parsed, null, 2),
            score: parsed.overallScore,
            durationMs: Date.now() - startMs,
            tokensUsed: response.usage?.total_tokens,
            completedAt: new Date(),
        },
    });

    return parsed;
}
