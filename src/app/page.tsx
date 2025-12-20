"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserWorkspaces } from "@/app/actions/workspaces";

interface Workspace {
  id: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  role: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      loadWorkspaces();
    }
    setLoading(false);
  }, [status]);

  async function loadWorkspaces() {
    try {
      const data = await getUserWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    }
  }

  // Not logged in
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">FlowPilot</h1>
          <p className="text-xl mb-8">AI-Powered Project Management</p>

          <div className="space-x-4">
            <Link
              href="/auth/signin"
              className="px-6 py-3 bg-white text-blue-600 rounded font-bold hover:bg-gray-100"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading || status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Logged in
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">FlowPilot</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {session?.user?.name || "User"}
            </span>
            <Link
              href="/api/auth/signout"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Workspaces Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Workspaces</h2>
            <Link
              href="/workspace/new"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + New Workspace
            </Link>
          </div>

          {workspaces.length === 0 ? (
            <div className="bg-white p-8 rounded-lg text-center text-gray-500">
              <p>No workspaces yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((ws) => (
                <Link
                  key={ws.workspace.id}
                  href={`/workspace/${ws.workspace.id}`}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                >
                  <h3 className="text-xl font-bold mb-2">
                    {ws.workspace.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Role: <strong>{ws.role}</strong>
                  </p>
                  <p className="text-sm text-blue-500">
                    View workspace →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}