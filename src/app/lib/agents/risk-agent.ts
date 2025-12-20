import { OpenAI } from "openai";
import { prisma } from "@/app/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function detectRisks(projectId: string) {
    // Fetch all tasks
    const tasks = await prisma.task.findMany({
        where: { projectId },
    });

    // Format for AI analysis
    const taskContext = tasks
        .map((t) => {
            const daysOld = Math.floor(
                (Date.now() - t.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            return `"${t.title}" - Status: ${t.status}, Priority: ${t.priority}, Not updated for ${daysOld} days`;
        })
        .join("\n");

    const prompt = `
Analyze these tasks for potential risks and blockers:

${taskContext}

Identify:
1. Blocked tasks (In progress for too long)
2. Resource issues (Can't find assignees)
3. Timeline risks (High priority but slow)
4. Dependency problems

Return ONLY JSON:
{
  "risks": [
    {
      "taskTitle": "string",
      "type": "BLOCKER|RESOURCE_CONSTRAINT|TIMELINE_RISK|DEPENDENCY_ISSUE|TECHNICAL_DEBT",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "description": "string"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,  // Very consistent, minimal creativity
        max_tokens: 1000,
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    // Save detected risks to database
    for (const risk of parsed.risks) {
        const task = tasks.find((t) => t.title === risk.taskTitle);
        if (task) {
            await prisma.risk.create({
                data: {
                    taskId: task.id,
                    type: risk.type,
                    severity: risk.severity,
                    description: risk.description,
                },
            });
        }
    }

    return parsed;
}