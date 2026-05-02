"use client";

import { useState } from "react";
import { createProject } from "@/app/actions/projects";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function CreateProjectForm({ workspaceId }: { workspaceId: string }) {
    const [name, setName] = useState("");
    const [goal, setGoal] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const project = await createProject({ workspaceId, name, goal });
            toast.success("Project created with AI plan!");
            router.push(`/workspace/${workspaceId}/project/${project.id}`);
        } catch (error) {
            console.error("Failed to create project:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create project");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">New Project</h1>
                                <p className="text-indigo-200 text-sm">AI will generate your full project plan</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-indigo-200 bg-white/10 rounded-lg px-3 py-2 w-fit">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Powered by GPT-4o-mini
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Project Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., User Dashboard Redesign"
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Project Goal
                            </label>
                            <textarea
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="Describe what you want to build. Be specific — the more detail you give, the better the AI plan will be.&#10;&#10;Example: Build user authentication with OAuth login via Google and GitHub, email/password signup, two-factor authentication, and a self-service password reset flow."
                                required
                                rows={7}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition resize-none"
                            />
                            <p className="text-xs text-slate-400 mt-1.5">
                                Be specific about features, integrations, and requirements for a better AI breakdown
                            </p>
                        </div>

                        {loading && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-indigo-700">AI is planning your project...</p>
                                    <p className="text-xs text-indigo-500 mt-0.5">Breaking down your goal into epics, features, and tasks</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating plan...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Create Project with AI
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
