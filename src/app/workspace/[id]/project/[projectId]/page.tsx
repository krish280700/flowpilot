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
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <Link href={`/workspace/${workspaceId}`} className="hover:text-indigo-600 transition-colors">Workspace</Link>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-slate-900 font-medium">Project Board</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900">Project Board</h1>
                        </div>
                        <DeleteProjectButton projectId={projectId} workspaceId={workspaceId} />
                    </div>
                </div>
            </header>

            {/* Board + Detail Panel */}
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <ProjectBoard projectId={projectId} />
                </div>

                {selectedTaskId && task && (
                    <div className="w-[420px] flex-shrink-0 bg-white border-l border-slate-200 overflow-y-auto shadow-xl">
                        <TaskDetail task={task} />
                    </div>
                )}
            </div>
        </div>
    );
}
