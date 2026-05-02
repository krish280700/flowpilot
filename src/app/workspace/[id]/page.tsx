"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Project {
    id: string;
    name: string;
    goal?: string;
    status: string;
    taskCount: number;
}

const STATUS_STYLE: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-slate-100 text-slate-600",
    ON_HOLD: "bg-amber-100 text-amber-700",
};

const PROJECT_ACCENTS = [
    "border-t-indigo-500",
    "border-t-violet-500",
    "border-t-blue-500",
    "border-t-emerald-500",
    "border-t-rose-500",
    "border-t-amber-500",
];

export default function WorkspacePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { data: session } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [workspaceName, setWorkspaceName] = useState("");

    useEffect(() => {
        loadProjects();
    }, [id]);

    async function loadProjects() {
        try {
            const response = await fetch(`/api/workspace/${id}/projects`);
            if (!response.ok) throw new Error("Failed to fetch projects");
            const data = await response.json();
            setProjects(data.projects || []);
            setWorkspaceName(data.workspaceName);
        } catch (error) {
            console.error("Failed to load projects:", error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading workspace...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Link href="/" className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Home
                        </Link>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-slate-900 font-medium">{workspaceName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{workspaceName}</h1>
                                <p className="text-sm text-slate-500">{projects.length} {projects.length === 1 ? "project" : "projects"}</p>
                            </div>
                        </div>

                        <Link
                            href={`/workspace/${id}/project/new`}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Project
                        </Link>
                    </div>
                </div>
            </header>

            {/* Projects */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {projects.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No projects yet</h3>
                        <p className="text-slate-500 text-sm mb-6">Create a project and let AI plan it for you</p>
                        <Link
                            href={`/workspace/${id}/project/new`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create first project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.map((project, i) => (
                            <Link
                                key={project.id}
                                href={`/workspace/${id}/project/${project.id}`}
                                className={`group bg-white border-2 border-t-4 border-slate-200 ${PROJECT_ACCENTS[i % PROJECT_ACCENTS.length]} rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-200`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight pr-2">
                                        {project.name}
                                    </h3>
                                    <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[project.status] || "bg-slate-100 text-slate-600"}`}>
                                        {project.status}
                                    </span>
                                </div>

                                {project.goal && (
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                                        {project.goal}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        {project.taskCount} tasks
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-indigo-600 font-medium">
                                        Open
                                        <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
