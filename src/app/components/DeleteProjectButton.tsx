"use client";

import { useTransition } from "react";
import { deleteProject } from "@/app/actions/projects";

interface DeleteProjectButtonProps {
    projectId: string;
    workspaceId: string;
}

export function DeleteProjectButton({ projectId, workspaceId }: DeleteProjectButtonProps) {
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            startTransition(async () => {
                try {
                    await deleteProject(projectId, workspaceId);
                } catch (error) {
                    console.error("Failed to delete project:", error);
                    alert("Failed to delete project");
                }
            });
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
        >
            {isPending ? "Deleting..." : "Delete Project"}
        </button>
    );
}
