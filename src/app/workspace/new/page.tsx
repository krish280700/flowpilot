"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/app/actions/workspaces";
import Link from "next/link";

export default function NewWorkspacePage() {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const workspace = await createWorkspace(name, slug);
            router.push(`/workspace/${workspace.id}`);
        } catch (err: any) {
            console.error("Failed to create workspace:", err);
            setError(err.message || "Failed to create workspace");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
                <Link href="/" className="text-blue-500 hover:underline mb-6 block">
                    ← Back to Dashboard
                </Link>

                <h1 className="text-2xl font-bold mb-6 text-gray-900">Create New Workspace</h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                // Auto-generate slug from name if slug is empty or matches previous slug
                                const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

                                setSlug(newSlug);
                            }}
                            placeholder="My Awesome Co"
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Workspace Slug (URL)
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                            placeholder="my-awesome-co"
                            required
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This will be used in your workspace URL
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Workspace"}
                    </button>
                </form>
            </div>
        </div>
    );
}
