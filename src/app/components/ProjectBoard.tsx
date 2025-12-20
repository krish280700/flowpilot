"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getProject, type ProjectWithRelations } from "@/app/actions/projects";
import { updateTaskStatus } from "@/app/actions/tasks";
import { TaskStatus, Prisma } from "@prisma/client";

// Extract types from ProjectWithRelations for proper typing
interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: string;
    estimatedHours: number | null;
    assignee?: { name: string | null } | null;
}

interface UserStory {
    id: string;
    title: string;
    description: string | null;
    status: string;
    tasks: Task[];
}

interface Feature {
    id: string;
    title: string;
    description: string | null;
    status: string;
    userStories: UserStory[];
    tasks: Task[];
}

interface Epic {
    id: string;
    title: string;
    description: string | null;
    status: string;
    features: Feature[];
    tasks: Task[];
}

type ProjectData = ProjectWithRelations;

type ViewMode = "cards" | "tree";

export function ProjectBoard({ projectId }: { projectId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [viewMode, setViewMode] = useState<ViewMode>("cards");
    const [projectData, setProjectData] = useState<ProjectData | null>(null);
    const [tasks, setTasks] = useState({
        TODO: [] as Task[],
        IN_PROGRESS: [] as Task[],
        IN_REVIEW: [] as Task[],
        COMPLETED: [] as Task[],
    } as any);
    const [loading, setLoading] = useState(true);

    // Load project on mount
    useEffect(() => {
        loadProject();
    }, [projectId]);

    async function loadProject() {
        try {
            const data: ProjectWithRelations = await getProject(projectId);
            setProjectData(data);

            // Organize tasks by status for card view - flatten all tasks from hierarchy
            const allTasks: Task[] = [];

            if (data.epics) {
                const epics = data.epics as unknown as Epic[];
                for (const epic of epics) {
                    // Tasks directly under epic
                    if (epic.tasks) {
                        allTasks.push(...epic.tasks);
                    }

                    // Tasks under features
                    if (epic.features) {
                        for (const feature of epic.features) {
                            if (feature.tasks) {
                                allTasks.push(...feature.tasks);
                            }

                            // Tasks under user stories
                            if (feature.userStories) {
                                for (const userStory of feature.userStories) {
                                    if (userStory.tasks) {
                                        allTasks.push(...userStory.tasks);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const organized = {
                TODO: allTasks.filter((t) => t.status === "TODO"),
                IN_PROGRESS: allTasks.filter((t) => t.status === "IN_PROGRESS"),
                IN_REVIEW: allTasks.filter((t) => t.status === "IN_REVIEW"),
                COMPLETED: allTasks.filter((t) => t.status === "COMPLETED"),
            };
            setTasks(organized);
        } finally {
            setLoading(false);
        }
    }

    // Handle task click to open detail panel
    function handleTaskClick(taskId: string) {
        const params = new URLSearchParams(searchParams);
        params.set("taskId", taskId);
        router.push(`${pathname}?${params.toString()}`);
    }

    // Handle drag-drop to change task status
    async function handleDragEnd(e: React.DragEvent, newStatus: TaskStatus) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");

        // Update in database
        await updateTaskStatus(taskId, newStatus);
        // Refresh board
        await loadProject();
    }

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div>
            {/* Toggle Button */}
            <div className="flex justify-end p-4 bg-white border-b">
                <button
                    onClick={() => setViewMode(viewMode === "cards" ? "tree" : "cards")}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                >
                    {viewMode === "cards" ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Tree View
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Card View
                        </>
                    )}
                </button>
            </div>

            {/* Render based on view mode */}
            {viewMode === "cards" ? (
                <CardView
                    tasks={tasks}
                    onTaskClick={handleTaskClick}
                    onDragEnd={handleDragEnd}
                />
            ) : (
                <TreeView
                    projectData={projectData}
                    onTaskClick={handleTaskClick}
                />
            )}
        </div>
    );
}

// Card View Component (original kanban board)
function CardView({
    tasks,
    onTaskClick,
    onDragEnd,
}: {
    tasks: {
        TODO: Task[];
        IN_PROGRESS: Task[];
        IN_REVIEW: Task[];
        COMPLETED: Task[];
    };
    onTaskClick: (taskId: string) => void;
    onDragEnd: (e: React.DragEvent, newStatus: TaskStatus) => void;
}) {
    return (
        <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50">
            {Object.entries(tasks).map(([status, taskList]) => (
                <div
                    key={status}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDragEnd(e, status as TaskStatus)}
                    className="bg-white rounded-lg p-4 min-h-screen shadow"
                >
                    {/* Column header */}
                    <h3 className="font-bold mb-4 text-lg">
                        {status}
                        <span className="text-sm text-gray-500 ml-2">
                            ({taskList.length})
                        </span>
                    </h3>

                    {/* Task list */}
                    <div className="space-y-3">
                        {taskList.map((task) => (
                            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tree View Component (hierarchical view)
function TreeView({
    projectData,
    onTaskClick,
}: {
    projectData: ProjectData | null;
    onTaskClick: (taskId: string) => void;
}) {
    if (!projectData) return <div className="p-8">No data available</div>;

    return (
        <div className="p-6 bg-gray-50">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">{projectData.name}</h2>

                {projectData.epics.length === 0 ? (
                    <p className="text-gray-500">No epics or tasks yet</p>
                ) : (
                    <div className="space-y-4">
                        {(projectData.epics as any as Epic[]).map((epic) => (
                            <EpicNode key={epic.id} epic={epic} onTaskClick={onTaskClick} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Epic Node Component (expandable epic section)
function EpicNode({ epic, onTaskClick }: { epic: Epic; onTaskClick: (taskId: string) => void }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="border rounded-lg p-4 bg-gray-50">
            {/* Epic Header */}
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {/* Expand/Collapse Icon */}
                    <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    <div>
                        <h3 className="font-bold text-lg">{epic.title}</h3>
                        {epic.description && (
                            <p className="text-sm text-gray-600 mt-1">{epic.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${getEpicStatusColor(epic.status)}`}>
                        {epic.status}
                    </span>
                    <span className="text-sm text-gray-600">
                        {epic.tasks.length} {epic.tasks.length === 1 ? "task" : "tasks"}
                    </span>
                </div>
            </div>

            {/* Epic Tasks */}
            {isExpanded && epic.tasks.length > 0 && (
                <div className="mt-4 ml-8 space-y-2">
                    {epic.tasks.map((task: Task) => (
                        <TaskNode key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
                    ))}
                </div>
            )}

            {isExpanded && epic.tasks.length === 0 && (
                <div className="mt-4 ml-8 text-gray-500 text-sm">No tasks in this epic</div>
            )}
        </div>
    );
}

// Task Node Component (task item in tree view)
function TaskNode({ task, onClick }: { task: Task; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`p-3 bg-white rounded border-l-4 cursor-pointer hover:shadow-md transition ${getStatusBorderColor(task.status)}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-700">
                        <span className={`px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                            {task.status}
                        </span>
                        <span className={`px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        {task.estimatedHours && <span>{task.estimatedHours}h</span>}
                        {task.assignee && (
                            <span className="text-blue-700 font-medium">{task.assignee.name}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Individual task card (for card view)
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div
            draggable
            onDragStart={(e) => {
                setIsDragging(true);
                e.dataTransfer.setData("taskId", task.id);
            }}
            onDragEnd={() => setIsDragging(false)}
            onClick={() => {
                // Only trigger click if not dragging
                if (!isDragging) {
                    onClick();
                }
            }}
            className={`bg-gray-50 p-3 rounded border-l-4 cursor-pointer hover:shadow-md transition hover:bg-gray-100 ${getStatusBorderColor(task.status)}`}
        >
            <h4 className="font-semibold text-sm text-gray-900">{task.title}</h4>

            {/* Metadata */}
            <div className="flex justify-between items-center mt-2 text-xs text-gray-700">
                <span>{task.estimatedHours}h</span>
                <span className={`px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>
            </div>

            {/* Assignee */}
            {task.assignee && (
                <p className="text-xs text-blue-700 font-medium mt-2">{task.assignee.name}</p>
            )}
        </div>
    );
}

// Helper functions
function getStatusBorderColor(status: string) {
    switch (status) {
        case "TODO":
            return "border-gray-400";
        case "IN_PROGRESS":
            return "border-blue-500";
        case "IN_REVIEW":
            return "border-orange-500";
        case "COMPLETED":
            return "border-green-500";
        default:
            return "border-gray-400";
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case "TODO":
            return "bg-gray-100 text-gray-800";
        case "IN_PROGRESS":
            return "bg-blue-100 text-blue-800";
        case "IN_REVIEW":
            return "bg-orange-100 text-orange-800";
        case "COMPLETED":
            return "bg-green-100 text-green-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

function getEpicStatusColor(status: string) {
    switch (status) {
        case "BACKLOG":
            return "bg-gray-100 text-gray-800";
        case "IN_PROGRESS":
            return "bg-blue-100 text-blue-800";
        case "COMPLETED":
            return "bg-green-100 text-green-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

function getPriorityColor(priority: string) {
    switch (priority) {
        case "CRITICAL":
            return "bg-red-100 text-red-800 font-semibold";
        case "HIGH":
            return "bg-orange-100 text-orange-800 font-semibold";
        case "MEDIUM":
            return "bg-yellow-100 text-yellow-800 font-semibold";
        default:
            return "bg-green-100 text-green-800 font-semibold";
    }
}

function getFeatureStatusColor(status: string) {
    switch (status) {
        case "BACKLOG":
            return "bg-gray-100 text-gray-800";
        case "IN_PROGRESS":
            return "bg-blue-100 text-blue-800";
        case "COMPLETED":
            return "bg-green-100 text-green-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

function getUserStoryStatusColor(status: string) {
    switch (status) {
        case "BACKLOG":
            return "bg-gray-100 text-gray-800";
        case "IN_PROGRESS":
            return "bg-blue-100 text-blue-800";
        case "COMPLETED":
            return "bg-green-100 text-green-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}
