"use server";

import { prisma } from "@/app/lib/prisma";
import { ProjectStatus, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateProjectPlan } from "@/app/lib/agents/planning-agent";
import { redirect } from "next/navigation";

// Create new project + trigger AI planning
export async function createProject(data: {
    workspaceId: string;
    name: string;
    goal: string;
}) {
    // Verify user is logged in
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    if (!data.workspaceId || data.workspaceId === "undefined") {
        throw new Error("Invalid workspace ID");
    }

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
        where: { id: data.workspaceId },
    });

    if (!workspace) throw new Error("Workspace not found");

    // Create project in database
    const project = await prisma.project.create({
        data: {
            workspaceId: data.workspaceId,
            name: data.name,
            goal: data.goal,
            status: "ACTIVE",
        },
    });

    // Trigger AI to break down goal into tasks
    try {
        await generateProjectPlan({
            projectGoal: data.goal,
            projectId: project.id,
        });
    } catch (error) {
        console.error("AI planning failed:", error);
    }

    return project;
}

// Define the include structure for type inference
const projectInclude = {
    epics: {
        include: {
            features: {
                include: {
                    userStories: {
                        include: {
                            tasks: {
                                include: {
                                    assignee: true,
                                },
                            },
                        },
                    },
                    tasks: {
                        include: {
                            assignee: true,
                        },
                    },
                },
            },
            tasks: {
                include: {
                    assignee: true,
                },
            },
        },
    },
    sprints: true,
};

// Export the type for use in components
export type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: typeof projectInclude;
}>;

// Fetch project with all related data
export async function getProject(projectId: string): Promise<ProjectWithRelations> {


    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: projectInclude,
    });

    if (!project) throw new Error("Project not found");
    return project;
}

// Update project status
export async function updateProject(
    projectId: string,
    data: { status?: ProjectStatus; name?: string }
) {
    return prisma.project.update({
        where: { id: projectId },
        data,
    });
}

// Delete project
export async function deleteProject(projectId: string, workspaceId: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Check if project exists (and maybe permissions, but simplified for now)
    await prisma.project.delete({
        where: { id: projectId },
    });

    // Revalidate and redirect
    redirect(`/workspace/${workspaceId}`);
}