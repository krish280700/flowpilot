"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Create workspace (team/organization)
export async function createWorkspace(name: string, slug: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const workspace = await prisma.workspace.create({
        data: { name, slug },
    });

    // Add creator as OWNER
    await prisma.workspaceMember.create({
        data: {
            workspaceId: workspace.id,
            userId: session.user.id,
            role: "OWNER",
        },
    });

    return workspace;
}

// Invite user to workspace
export async function inviteUserToWorkspace(
    workspaceId: string,
    email: string,
    role: "MANAGER" | "DEVELOPER"
) {
    // Find or create user (simplified)
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) throw new Error("User not found");

    return prisma.workspaceMember.create({
        data: {
            workspaceId,
            userId: user.id,
            role,
        },
    });
}

// Get user's workspaces
export async function getUserWorkspaces() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    return prisma.workspaceMember.findMany({
        where: { userId: session.user.id },
        include: { workspace: true },
    });
}