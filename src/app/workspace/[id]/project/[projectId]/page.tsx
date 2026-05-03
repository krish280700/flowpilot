import { ProjectBoard } from "@/app/components/ProjectBoard";
import { TaskDetail } from "@/app/components/TaskDetail";
import { AgentPipelinePanel } from "@/app/components/AgentPipelinePanel";
import Link from "next/link";
import { DeleteProjectButton } from "@/app/components/DeleteProjectButton";
import { getTaskDetails } from "@/app/actions/tasks";
import { getProject } from "@/app/actions/projects";

export default async function ProjectPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string; projectId: string }>;
    searchParams: Promise<{ taskId?: string; view?: string }>;
}) {
    const { id: workspaceId, projectId } = await params;
    const { taskId: selectedTaskId, view } = await searchParams;

    const [task, project] = await Promise.all([
        selectedTaskId ? getTaskDetails(selectedTaskId) : Promise.resolve(null),
        getProject(projectId),
    ]);

    const showAgents = view === "agents";

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
                        <span className="text-slate-900 font-medium">{project.name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
                                {project.description && (
                                    <p className="text-xs text-slate-500 line-clamp-1 max-w-md">{project.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* View toggle */}
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                <Link
                                    href={`/workspace/${workspaceId}/project/${projectId}`}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        !showAgents ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                    </svg>
                                    Board
                                </Link>
                                <Link
                                    href={`/workspace/${workspaceId}/project/${projectId}?view=agents`}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        showAgents ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    AI Agents
                                </Link>
                            </div>

                            <DeleteProjectButton projectId={projectId} workspaceId={workspaceId} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            {showAgents ? (
                /* Agent Pipeline View */
                <div className="flex-1 overflow-auto">
                    <div className="max-w-3xl mx-auto py-8 px-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-1">AI Agent Pipeline</h2>
                            <p className="text-sm text-slate-500">
                                7 specialized agents worked together to create and optimize this project plan.
                            </p>
                        </div>

                        {/* Project summary card */}
                        {project.description && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-slate-700">AI-Generated Kickoff Brief</span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                            </div>
                        )}

                        {/* Agent pipeline */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <AgentPipelinePanel projectId={projectId} />
                        </div>
                    </div>
                </div>
            ) : (
                /* Board View */
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
            )}
        </div>
    );
}
