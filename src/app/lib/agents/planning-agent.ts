import { OpenAI } from "openai";
import { prisma } from "@/app/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PlanInput {
    projectGoal: string;
    projectId: string;
}

export async function generateProjectPlan(input: PlanInput) {
    const { projectGoal, projectId } = input;

    // Prompt tells ChatGPT what to do
    const prompt = `
You are an expert project manager. Use the Agile methodology to Break down this goal into:
1. Epics (major feature groups)
2. Tasks (individual work items)

For each task include: title, description, estimated hours, and priority.

Goal: "${projectGoal}"

Return ONLY valid JSON (no extra text):
{
  "epics": [
    {
      "title": "Epic Name",
      "description": "What this epic covers",
      "tasks": [
        {
          "title": "Task name",
          "description": "Task details",
          "estimatedHours": 8,
          "priority": "HIGH"
        }
      ]
    }
  ]
}`;

    try {
        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,  // 0.7 = balanced creativity vs consistency
            max_tokens: 2000,  // Limit response length
        });

        // Extract response text
        let content = response.choices[0].message.content || "{}";

        // Sanitize: Remove ```json and ``` markdown if present
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(content);
        const normalized = normalizePlan(parsed)
        // Defensive check: Ensure epics is an array
        if (!normalized.epics || !Array.isArray(normalized.epics)) {
            console.error("AI returned malformed data: 'epics' is not an array", normalized);
            throw new Error("AI failed to generate a valid project structure (no epics found).");
        }

        // Save epics and tasks to database
        for (const epic of normalized.epics) {
            const createdEpic = await prisma.epic.create({
                data: {
                    projectId,
                    title: epic.title || "Untitled Epic",
                    description: epic.description || "",
                    status: "BACKLOG",
                },
            });

            // Defensive check: Ensure tasks is an array
            if (epic.tasks && Array.isArray(epic.tasks)) {
                for (const task of epic.tasks) {
                    await prisma.task.create({
                        data: {
                            projectId,
                            epicId: createdEpic.id,
                            title: task.title || "Untitled Task",
                            description: task.description || "",
                            estimatedHours: typeof task.estimatedHours === 'string' ?
                                parseInt(task.estimatedHours, 10) :
                                (typeof task.estimatedHours === 'number' ? task.estimatedHours : null),
                            priority: task.priority || "MEDIUM",
                            status: "TODO",
                        },
                    });
                }
            }
        }

        return normalized;
    } catch (error) {
        console.error("Planning agent error:", error);
        throw error;
    }
}

function normalizePlan(parsed: any) {
    if (!Array.isArray(parsed.epics)) return { epics: [] };

    return {
        epics: parsed.epics.map((epic: any) => ({
            title: typeof epic.title === "string" ? epic.title : "Untitled Epic",
            description: typeof epic.description === "string" ? epic.description : "",
            tasks: Array.isArray(epic.tasks)
                ? epic.tasks.map((task: any) => ({
                    title: typeof task.title === "string" ? task.title : "Untitled Task",
                    description: typeof task.description === "string" ? task.description : "",
                    estimatedHours:
                        typeof task.estimatedHours === "number"
                            ? task.estimatedHours
                            : parseInt(task.estimatedHours, 10) || null,
                    priority:
                        ["LOW", "MEDIUM", "HIGH"].includes(task.priority)
                            ? task.priority
                            : "MEDIUM",
                }))
                : [], // 🔑 GUARANTEE ARRAY
        })),
    };
}
