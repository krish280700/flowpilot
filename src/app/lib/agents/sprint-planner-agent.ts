import { OpenAI } from "openai";
import { prisma } from "@/app/lib/prisma";
import type { DependencyMap } from "./dependency-agent";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SPRINT_DURATION_DAYS = 14; // 2-week sprints
const HOURS_PER_SPRINT = 80;     // ~2 devs × 5 days × 8h

export interface SprintPlan {
    sprints: {
        name: string;
        goal: string;
        tasks: string[];    // task titles
        totalHours: number;
    }[];
}

export async function planSprints(
    projectId: string,
    dependencyMap: DependencyMap
): Promise<SprintPlan> {
    const tasks = await prisma.task.findMany({
        where: { projectId },
        include: { epic: true },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (tasks.length === 0) return { sprints: [] };

    const totalHours = tasks.reduce((a, t) => a + (t.estimatedHours || 4), 0);
    const estimatedSprints = Math.ceil(totalHours / HOURS_PER_SPRINT);

    const taskList = tasks
        .map(
            (t) =>
                `- "${t.title}" | Epic: ${t.epic?.title || "None"} | Priority: ${t.priority} | Est: ${t.estimatedHours || 4}h`
        )
        .join("\n");

    const criticalPath = dependencyMap.criticalPath?.join(" → ") || "None identified";

    const prompt = `You are an Agile sprint planner organizing tasks into ${SPRINT_DURATION_DAYS}-day sprints.

CONSTRAINTS:
- Max ${HOURS_PER_SPRINT} hours per sprint (assume 2 developers)
- Sprint capacity: ${HOURS_PER_SPRINT}h
- Estimated number of sprints needed: ~${estimatedSprints}

CRITICAL PATH (must be prioritized in early sprints):
${criticalPath}

ALL TASKS (${tasks.length} tasks, ${totalHours}h total):
${taskList}

Rules:
1. Put foundation/infrastructure tasks in Sprint 1
2. Follow the critical path ordering
3. Group related tasks in the same sprint
4. Don't exceed ${HOURS_PER_SPRINT}h per sprint
5. Give each sprint a clear, deliverable-focused goal

Return ONLY valid JSON:
{
  "sprints": [
    {
      "name": "Sprint 1 - Foundation",
      "goal": "Set up project infrastructure and core data models",
      "tasks": ["Task title 1", "Task title 2"],
      "totalHours": 72
    }
  ]
}`;

    const startMs = Date.now();
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
    });

    let content = response.choices[0].message.content || "{}";
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed: SprintPlan = JSON.parse(content);

    // Create sprints in DB and assign tasks
    const now = new Date();
    let createdSprints = 0;
    let assignedTasks = 0;

    for (let i = 0; i < (parsed.sprints || []).length; i++) {
        const sprintData = parsed.sprints[i];
        const startDate = new Date(now);
        startDate.setDate(now.getDate() + i * SPRINT_DURATION_DAYS);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + SPRINT_DURATION_DAYS);

        const sprint = await prisma.sprint.create({
            data: {
                projectId,
                name: sprintData.name,
                goal: sprintData.goal,
                startDate,
                endDate,
                status: i === 0 ? "ACTIVE" : "PLANNED",
            },
        });
        createdSprints++;

        // Assign tasks to sprint
        for (const taskTitle of sprintData.tasks || []) {
            const task = tasks.find(
                (t) => t.title.toLowerCase() === taskTitle.toLowerCase()
            );
            if (task && !task.sprintId) {
                await prisma.task.update({
                    where: { id: task.id },
                    data: { sprintId: sprint.id },
                });
                assignedTasks++;
            }
        }
    }

    // Log to DB
    await prisma.agentLog.create({
        data: {
            projectId,
            agentName: "SprintPlannerAgent",
            agentRole: "Sprint organizer — groups tasks into time-boxed sprints respecting dependencies",
            status: "COMPLETED",
            input: `${tasks.length} tasks | ${totalHours}h total | Critical path: ${dependencyMap.criticalPath?.length || 0} tasks`,
            output: `Created ${createdSprints} sprints covering ${assignedTasks}/${tasks.length} tasks over ~${estimatedSprints * 2} weeks`,
            durationMs: Date.now() - startMs,
            tokensUsed: response.usage?.total_tokens,
            completedAt: new Date(),
        },
    });

    return parsed;
}
