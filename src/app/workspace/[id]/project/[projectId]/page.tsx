import { ProjectBoard } from "@/app/components/ProjectBoard";
import { TaskDetail } from "@/app/components/TaskDetail";
import Link from "next/link";
import { DeleteProjectButton } from "@/app/components/DeleteProjectButton";
import { getTaskDetails } from "@/app/actions/tasks";

export default async function ProjectPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string; projectId: string }>;
    searchParams: Promise<{ taskId?: string }>;
}) {

    const { id: workspaceId, projectId } = await params;
    const { taskId: selectedTaskId } = await searchParams;

    const task = selectedTaskId ? await getTaskDetails(selectedTaskId) : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Link href={`/workspace/${workspaceId}`} className="text-blue-500 hover:underline">
                        ← Back to Workspace
                    </Link>
                    <div className="flex justify-between items-center mt-2">
                        <h1 className="text-2xl font-bold">Project Board</h1>
                        <DeleteProjectButton projectId={projectId} workspaceId={workspaceId} />
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex">
                {/* Kanban Board (Left) */}
                <div className="flex-1">
                    <ProjectBoard projectId={projectId} />
                </div>

                {/* Task Detail (Right) - Shows when task selected */}
                {selectedTaskId && task && (
                    <div className="w-96 bg-white shadow-lg border-l">
                        <TaskDetail
                            task={task}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}