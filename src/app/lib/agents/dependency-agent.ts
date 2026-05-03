import { OpenAI } from "openai";
import { prisma } from "@/app/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DependencyMap {
    dependencies: {
        taskTitle: string;
        dependsOn: string[];   // task titles this task needs completed first
        blocks: string[];      // task titles this task blocks
        rationale: string;
    }[];
    criticalPath: string[];   // ordered list of must-do-first tasks
}

export async function analyzeDependencies(projectId: string): Promise<DependencyMap> {
    const tasks = await prisma.task.findMany({
        where: { projectId },
        include: { epic: true },
        orderBy: { createdAt: "asc" },
    });

    if (tasks.length === 0) return { dependencies: [], criticalPath: [] };

    const taskList = tasks
        .map((t) => `[${t.epic?.title || "No Epic"}] ${t.title} (${t.priority})`)
        .join("\n");

    const prompt = `You are a technical project manager analyzing task dependencies for a software project.

TASKS:
${taskList}

Identify logical dependencies: which tasks MUST be done before others based on:
- Technical dependencies (e.g., "Set up database" before "Create user model")
- Architecture dependencies (e.g., "Design API contracts" before "Build endpoints")
- Integration dependencies (e.g., "Build backend endpoint" before "Connect frontend")

Only include REAL dependencies that would block progress. Don't create artificial ones.

Also identify the critical path: the ordered sequence of highest-priority blocking tasks.

Return ONLY valid JSON:
{
  "dependencies": [
    {
      "taskTitle": "Build user login API",
      "dependsOn": ["Set up database schema", "Configure authentication middleware"],
      "blocks": ["Build login UI", "Write login tests"],
      "rationale": "API must exist before UI can call it"
    }
  ],
  "criticalPath": ["Set up database schema", "Configure authentication middleware", "Build user login API", "Build login UI"]
}`;

    const startMs = Date.now();
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 2000,
    });

    let content = response.choices[0].message.content || "{}";
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed: DependencyMap = JSON.parse(content);

    // Update task descriptions with dependency context
    for (const dep of parsed.dependencies || []) {
        const task = tasks.find(
            (t) => t.title.toLowerCase() === dep.taskTitle.toLowerCase()
        );
        if (task && dep.dependsOn.length > 0) {
            const depNote = `\n\n[Dependencies: Requires "${dep.dependsOn.join('", "')}" to be completed first]`;
            const currentDesc = task.description || "";
            if (!currentDesc.includes("[Dependencies:")) {
                await prisma.task.update({
                    where: { id: task.id },
                    data: { description: currentDesc + depNote },
                });
            }
        }
    }

    // Log to DB
    await prisma.agentLog.create({
        data: {
            projectId,
            agentName: "DependencyAgent",
            agentRole: "Dependency mapper — identifies blocking relationships and critical path",
            status: "COMPLETED",
            input: `Analyzed ${tasks.length} tasks across ${new Set(tasks.map((t) => t.epicId)).size} epics`,
            output: `Found ${parsed.dependencies?.length || 0} dependency relationships. Critical path: ${parsed.criticalPath?.length || 0} tasks`,
            durationMs: Date.now() - startMs,
            tokensUsed: response.usage?.total_tokens,
            completedAt: new Date(),
        },
    });

    return parsed;
}
