import { OpenAI } from "openai";
import { prisma } from "@/app/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateDailySummary(projectId: string) {
    // Fetch all tasks with recent updates
    const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
            updates: {
                orderBy: { createdAt: "desc" },
                take: 5,  // Last 5 updates per task
            },
            assignee: { select: { name: true } },
        },
    });

    // Format task info for AI to read
    const taskSummary = tasks
        .map((t) => {
            const updates = t.updates
                .map((u) => `"${u.comment}" (${u.newStatus})`)
                .join("; ");
            return `Task: ${t.title}
Status: ${t.status}
Assigned: ${t.assignee?.name || "Unassigned"}
Recent updates: ${updates || "No updates"}`;
        })
        .join("\n\n");

    const prompt = `
Based on these task updates, write a brief daily project status report.

${taskSummary}

Include:
- What got completed today
- What's in progress
- Any blockers or issues
- Tomorrow's focus areas

Keep it to 2-3 paragraphs, concise and actionable.`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,  // More consistent, less creative
        max_tokens: 500,
    });

    const summary = response.choices[0].message.content || "";
    return summary;
}