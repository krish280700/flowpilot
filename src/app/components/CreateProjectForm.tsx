"use client";

import { useState } from "react";
import { createProject } from "@/app/actions/projects";
import { useRouter } from "next/navigation";

export function CreateProjectForm({ workspaceId }: { workspaceId: string }) {
    const [name, setName] = useState("");
    const [goal, setGoal] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const project = await createProject({
                workspaceId,
                name,
                goal,
            });

            // Redirect to new project
            router.push(`/workspace/${workspaceId}/project/${project.id}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">New Project</h2>

            {/* Project name input */}
            <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                    Project Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., User Dashboard Redesign"
                    required
                    className="w-full px-3 py-2 border rounded"
                />
            </div>

            {/* Project goal input */}
            <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Goal</label>
                <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Describe what you want to build. AI will break this down into tasks..."
                    required
                    rows={6}
                    className="w-full px-3 py-2 border rounded"
                />
                <p className="text-xs text-gray-600 mt-1">
                    Be specific! Example: "Build user authentication with OAuth, email
                    signup, 2FA, and password reset"
                </p>
            </div>

            {/* Submit button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400"
            >
                {loading ? "Creating project & planning tasks..." : "Create Project"}
            </button>
        </form>
    );
}