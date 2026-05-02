"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getProject, type ProjectWithRelations } from "@/app/actions/projects";
import { updateTaskStatus } from "@/app/actions/tasks";
import { TaskStatus } from "@prisma/client";

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

const COLUMNS: { key: TaskStatus; label: string; color: string; dot: string; bg: string }[] = [
    { key: "TODO", label: "To Do", color: "text-slate-600", dot: "bg-slate-400", bg: "bg-slate-50" },
    { key: "IN_PROGRESS", label: "In Progress", color: "text-blue-600", dot: "bg-blue-500", bg: "bg-blue-50" },
    { key: "IN_REVIEW", label: "In Review", color: "text-amber-600", dot: "bg-amber-500", bg: "bg-amber-50" },
    { key: "COMPLETED", label: "Completed", color: "text-emerald-600", dot: "bg-emerald-500", bg: "bg-emerald-50" },
];

export function ProjectBoard({ projectId }: { projectId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [viewMode, setViewMode] = useState<ViewMode>("cards");
    const [projectData, setProjectData] = useState<ProjectData | null>(null);
    const [tasks, setTasks] = useState<Record<TaskStatus, Task[]>>({
        TODO: [],
        IN_PROGRESS: [],
        IN_REVIEW: [],
        COMPLETED: [],
    });
    const [loading, setLoading] = useState(true);
    const [draggingOver, setDraggingOver] = useState<string | null>(null);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    async function loadProject() {
        try {
            const data: ProjectWithRelations = await getProject(projectId);
            setProjectData(data);

            const allTasks: Task[] = [];
            if (data.epics) {
                const epics = data.epics as unknown as Epic[];
                for (const epic of epics) {
                    if (epic.tasks) allTasks.push(...epic.tasks);
                    if (epic.features) {
                        for (const feature of epic.features) {
                            if (feature.tasks) allTasks.push(...feature.tasks);
                            if (feature.userStories) {
                                for (const userStory of feature.userStories) {
                                    if (userStory.tasks) allTasks.push(...userStory.tasks);
                                }
                            }
                        }
                    }
                }
            }

            setTasks({
                TODO: allTasks.filter((t) => t.status === "TODO"),
                IN_PROGRESS: allTasks.filter((t) => t.status === "IN_PROGRESS"),
                IN_REVIEW: allTasks.filter((t) => t.status === "IN_REVIEW"),
                COMPLETED: allTasks.filter((t) => t.status === "COMPLETED"),
            });
        } finally {
            setLoading(false);
        }
    }

    function handleTaskClick(taskId: string) {
        const params = new URLSearchParams(searchParams);
        params.set("taskId", taskId);
        router.push(`${pathname}?${params.toString()}`);
    }

    async function handleDrop(e: React.DragEvent, newStatus: TaskStatus) {
        e.preventDefault();
        setDraggingOver(null);
        const taskId = e.dataTransfer.getData("taskId");
        await updateTaskStatus(taskId, newStatus);
        await loadProject();
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Loading board...
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {Object.values(tasks).flat().length} tasks
                </div>

                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("cards")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            viewMode === "cards"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Board
                    </button>
                    <button
                        onClick={() => setViewMode("tree")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            viewMode === "tree"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Tree
                    </button>
                </div>
            </div>

            {viewMode === "cards" ? (
                <CardView tasks={tasks} onTaskClick={handleTaskClick} onDrop={handleDrop} draggingOver={draggingOver} onDraggingOver={setDraggingOver} />
            ) : (
                <TreeView projectData={projectData} onTaskClick={handleTaskClick} />
            )}
        </div>
    );
}

function CardView({
    tasks,
    onTaskClick,
    onDrop,
    draggingOver,
    onDraggingOver,
}: {
    tasks: Record<TaskStatus, Task[]>;
    onTaskClick: (taskId: string) => void;
    onDrop: (e: React.DragEvent, status: TaskStatus) => void;
    draggingOver: string | null;
    onDraggingOver: (status: string | null) => void;
}) {
    return (
        <div className="flex gap-4 p-6 overflow-x-auto flex-1">
            {COLUMNS.map((col) => (
                <div
                    key={col.key}
                    onDragOver={(e) => { e.preventDefault(); onDraggingOver(col.key); }}
                    onDragLeave={() => onDraggingOver(null)}
                    onDrop={(e) => onDrop(e, col.key)}
                    className={`flex-1 min-w-[240px] flex flex-col rounded-2xl border-2 transition-colors ${
                        draggingOver === col.key
                            ? "border-indigo-300 bg-indigo-50/50"
                            : "border-transparent bg-slate-100"
                    }`}
                >
                    {/* Column header */}
                    <div className="px-4 pt-4 pb-3 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                        <h3 className={`font-semibold text-sm ${col.color}`}>{col.label}</h3>
                        <span className="ml-auto bg-white text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                            {tasks[col.key].length}
                        </span>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 px-3 pb-3 space-y-2 min-h-[200px]">
                        {tasks[col.key].map((task) => (
                            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

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
            onClick={() => { if (!isDragging) onClick(); }}
            className={`bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-150 ${
                isDragging ? "opacity-50 rotate-1 scale-95" : ""
            }`}
        >
            <h4 className="text-sm font-medium text-slate-800 leading-snug mb-3">{task.title}</h4>

            <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)}`}>
                    {task.priority}
                </span>
                {task.estimatedHours && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {task.estimatedHours}h
                    </span>
                )}
            </div>

            {task.assignee?.name && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-indigo-600">{task.assignee.name[0]}</span>
                    </div>
                    <span className="text-xs text-slate-500">{task.assignee.name}</span>
                </div>
            )}
        </div>
    );
}

function TreeView({ projectData, onTaskClick }: { projectData: ProjectData | null; onTaskClick: (taskId: string) => void }) {
    if (!projectData) return <div className="p-8 text-slate-500">No data available</div>;

    return (
        <div className="p-6 overflow-auto flex-1">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-bold text-slate-900 mb-1">{projectData.name}</h2>
                {projectData.goal && (
                    <p className="text-sm text-slate-500 mb-6">{projectData.goal}</p>
                )}

                {projectData.epics.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                        No epics or tasks yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(projectData.epics as any as Epic[]).map((epic, i) => (
                            <EpicNode key={epic.id} epic={epic} onTaskClick={onTaskClick} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const EPIC_COLORS = [
    { border: "border-l-indigo-500", bg: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-700", icon: "text-indigo-500" },
    { border: "border-l-violet-500", bg: "bg-violet-50", badge: "bg-violet-100 text-violet-700", icon: "text-violet-500" },
    { border: "border-l-blue-500", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700", icon: "text-blue-500" },
    { border: "border-l-emerald-500", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", icon: "text-emerald-500" },
    { border: "border-l-rose-500", bg: "bg-rose-50", badge: "bg-rose-100 text-rose-700", icon: "text-rose-500" },
];

function EpicNode({ epic, onTaskClick, index }: { epic: Epic; onTaskClick: (taskId: string) => void; index: number }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const color = EPIC_COLORS[index % EPIC_COLORS.length];

    return (
        <div className={`bg-white border border-slate-200 border-l-4 ${color.border} rounded-xl overflow-hidden`}>
            <button
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <svg
                        className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                        <span className="font-semibold text-slate-900 text-sm">{epic.title}</span>
                        {epic.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{epic.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.badge}`}>
                        {epic.status}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {epic.tasks.length} tasks
                    </span>
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-slate-100">
                    {epic.tasks.length === 0 ? (
                        <p className="px-12 py-3 text-xs text-slate-400 italic">No tasks in this epic</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {epic.tasks.map((task) => (
                                <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 px-12 py-3 hover:bg-slate-50 transition-colors text-left group"
        >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(task.status)}`} />
            <span className="flex-1 text-sm text-slate-700 group-hover:text-slate-900 truncate">{task.title}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityStyle(task.priority)}`}>
                    {task.priority}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusStyle(task.status)}`}>
                    {task.status.replace("_", " ")}
                </span>
                {task.estimatedHours && (
                    <span className="text-xs text-slate-400">{task.estimatedHours}h</span>
                )}
            </div>
        </button>
    );
}

function getStatusDot(status: string) {
    switch (status) {
        case "TODO": return "bg-slate-400";
        case "IN_PROGRESS": return "bg-blue-500";
        case "IN_REVIEW": return "bg-amber-500";
        case "COMPLETED": return "bg-emerald-500";
        default: return "bg-slate-400";
    }
}

function getStatusStyle(status: string) {
    switch (status) {
        case "TODO": return "bg-slate-100 text-slate-600";
        case "IN_PROGRESS": return "bg-blue-100 text-blue-700";
        case "IN_REVIEW": return "bg-amber-100 text-amber-700";
        case "COMPLETED": return "bg-emerald-100 text-emerald-700";
        default: return "bg-slate-100 text-slate-600";
    }
}

function getPriorityStyle(priority: string) {
    switch (priority) {
        case "CRITICAL": return "bg-rose-100 text-rose-700";
        case "HIGH": return "bg-orange-100 text-orange-700";
        case "MEDIUM": return "bg-yellow-100 text-yellow-700";
        default: return "bg-green-100 text-green-700";
    }
}
