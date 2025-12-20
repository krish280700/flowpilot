"use server";

import { prisma } from "@/app/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Update task status (e.g., TODO → IN_PROGRESS)
export async function updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus
) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Get old status for logging
    const task = await prisma.task.findUnique({
        where: { id: taskId },
    });

    // Update task
    const updated = await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
    });

    // Log the change (for daily summary + history)
    await prisma.taskUpdate.create({
        data: {
            taskId,
            userId: session?.user?.id ? session?.user?.id : "",
            oldStatus: task?.status,
            newStatus: newStatus as any,
            comment: `Status changed to ${newStatus}`,
        },
    });

    return updated;
}

// Add comment + log update
export async function addTaskComment(taskId: string, comment: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const task = await prisma.task.findUnique({
        where: { id: taskId },
    });

    // Create update log entry
    return prisma.taskUpdate.create({
        data: {
            taskId,
            userId: session?.user?.id ? session?.user?.id : "",
            newStatus: task?.status,
            comment,
        },
    });
}

// Assign task to someone
export async function assignTask(taskId: string, assigneeId: string) {
    return prisma.task.update({
        where: { id: taskId },
        data: { assigneeId },
    });
}

// Update task hours (developer logs time)
export async function logTaskHours(taskId: string, hours: number) {
    return prisma.task.update({
        where: { id: taskId },
        data: { actualHours: hours },
    });
}

// Get full task details
export async function getTaskDetails(taskId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    return prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignee: true,
            updates: {
                include: {
                    user: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            risks: true,
        },
    });
}
