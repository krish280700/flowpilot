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

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div>
                        <Link href="/" className="text-blue-500 hover:underline">
                            ← Back to Workspaces
                        </Link>
                        <h1 className="text-3xl font-bold mt-2">{workspaceName}</h1>
                    </div>
                    <Link
                        href={`/workspace/${id}/project/new`}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        + New Project
                    </Link>
                </div>
            </header>

            {/* Projects Grid */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {projects.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg text-center text-gray-500">
                        <p>No projects yet. Create one to start!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/workspace/${id}/project/${project.id}`}
                                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                            >
                                <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {project.goal || "No description"}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm px-3 py-1 rounded ${project.status === "ACTIVE"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                        }`}>
                                        {project.status}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {project.taskCount} tasks
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}