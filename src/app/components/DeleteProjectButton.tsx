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
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-xl disabled:opacity-50 text-sm font-medium transition-colors"
        >
            {isPending ? (
                <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            )}
            {!isPending && "Delete Project"}
        </button>
    );
}
