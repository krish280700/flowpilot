import { OpenAI } from "openai";
import { prisma } from "@/app/lib/prisma";
import type { EvaluationResult } from "./evaluation-agent";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RefinedAdditions {
    newEpics: {
        title: string;
        description: string;
        tasks: {
            title: string;
            description: string;
            estimatedHours: number;
            priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        }[];
    }[];
    tasksToAdd: {
        epicTitle: string; // which existing epic to add to
        title: string;
        description: string;
        estimatedHours: number;
        priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }[];
}

export async function refinePlan(
    projectId: string,
    projectGoal: string,
    evaluation: EvaluationResult
): Promise<RefinedAdditions> {
    const existingEpics = await prisma.epic.findMany({
        where: { projectId },
        include: { tasks: true },
    });

    const existingEpicNames = existingEpics.map((e) => e.title);
    const planSummary = existingEpics
        .map((epic) => {
            const taskList = epic.tasks
                .map((t) => `  - ${t.title} (${t.priority}, ${t.estimatedHours}h)`)
                .join("\n");
            return `EPIC: "${epic.title}"\n${taskList}`;
        })
        .join("\n\n");

    const prompt = `You are a senior engineering manager refining an AI-generated project plan based on evaluation feedback.

PROJECT GOAL: "${projectGoal}"

CURRENT PLAN:
${planSummary}

EVALUATION FEEDBACK (overall score: ${evaluation.overallScore}/10):
- Missing areas: ${evaluation.missingAreas.join(", ")}
- Specific gaps: ${evaluation.feedback.join("; ")}
- Weak scores: ${Object.entries(evaluation.scores)
        .filter(([, v]) => v < 7)
        .map(([k, v]) => `${k}: ${v}/10`)
        .join(", ")}

Existing epic names: ${existingEpicNames.join(", ")}

Your job: Add ONLY what's missing to make the plan complete. Do NOT duplicate existing work.
For each missing area:
1. If it fits an existing epic, add tasks to it (use tasksToAdd with exact epicTitle match)
2. If it needs a new epic, create one (use newEpics)

Return ONLY valid JSON:
{
  "newEpics": [
    {
      "title": "Testing & Quality Assurance",
      "description": "Comprehensive test coverage",
      "tasks": [
        { "title": "Write unit tests for auth module", "description": "...", "estimatedHours": 8, "priority": "HIGH" }
      ]
    }
  ],
  "tasksToAdd": [
    {
      "epicTitle": "existing epic title here",
      "title": "Add error boundary handling",
      "description": "...",
      "estimatedHours": 4,
      "priority": "MEDIUM"
    }
  ]
}`;

    const startMs = Date.now();
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
    });

    let content = response.choices[0].message.content || "{}";
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed: RefinedAdditions = JSON.parse(content);

    let addedEpics = 0;
    let addedTasks = 0;

    // Add new epics
    if (parsed.newEpics && Array.isArray(parsed.newEpics)) {
        for (const epicData of parsed.newEpics) {
            const epic = await prisma.epic.create({
                data: {
                    projectId,
                    title: epicData.title,
                    description: epicData.description,
                    status: "BACKLOG",
                },
            });
            addedEpics++;

            for (const task of epicData.tasks || []) {
                await prisma.task.create({
                    data: {
                        projectId,
                        epicId: epic.id,
                        title: task.title,
                        description: task.description,
                        estimatedHours: task.estimatedHours,
                        priority: task.priority || "MEDIUM",
                        status: "TODO",
                    },
                });
                addedTasks++;
            }
        }
    }

    // Add tasks to existing epics
    if (parsed.tasksToAdd && Array.isArray(parsed.tasksToAdd)) {
        for (const taskData of parsed.tasksToAdd) {
            const epic = existingEpics.find(
                (e) => e.title.toLowerCase() === taskData.epicTitle?.toLowerCase()
            );
            if (epic) {
                await prisma.task.create({
                    data: {
                        projectId,
                        epicId: epic.id,
                        title: taskData.title,
                        description: taskData.description,
                        estimatedHours: taskData.estimatedHours,
                        priority: taskData.priority || "MEDIUM",
                        status: "TODO",
                    },
                });
                addedTasks++;
            }
        }
    }

    // Log to DB
    await prisma.agentLog.create({
        data: {
            projectId,
            agentName: "RefinementAgent",
            agentRole: "Plan improver — fills gaps identified by the evaluation agent",
            status: "COMPLETED",
            input: `Evaluation score: ${evaluation.overallScore}/10 | Missing: ${evaluation.missingAreas.join(", ")}`,
            output: `Added ${addedEpics} new epics and ${addedTasks} new tasks to close identified gaps`,
            durationMs: Date.now() - startMs,
            tokensUsed: response.usage?.total_tokens,
            completedAt: new Date(),
        },
    });

    return parsed;
}
