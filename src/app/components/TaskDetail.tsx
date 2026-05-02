"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { addTaskComment, logTaskHours } from "@/app/actions/tasks";

interface TaskDetailProps {
    task: any;
    onUpdate?: () => void;
    onClose?: () => void;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
    TODO: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
    IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    IN_REVIEW: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
    COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: "bg-rose-100", text: "text-rose-700" },
    HIGH: { bg: "bg-orange-100", text: "text-orange-700" },
    MEDIUM: { bg: "bg-yellow-100", text: "text-yellow-700" },
    LOW: { bg: "bg-green-100", text: "text-green-700" },
};

export function TaskDetail({ task, onUpdate, onClose }: TaskDetailProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [comment, setComment] = useState("");
    const [hours, setHours] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function handleUpdate() {
        if (onUpdate) onUpdate();
        else router.refresh();
    }

    function handleClose() {
        if (onClose) {
            onClose();
        } else {
            const params = new URLSearchParams(searchParams);
            params.delete("taskId");
            router.push(`${pathname}?${params.toString()}`);
        }
    }

    async function handleComment() {
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            await addTaskComment(task.id, comment);
            setComment("");
            handleUpdate();
        } finally {
            setSubmitting(false);
        }
    }

    async function handleLogHours() {
        if (!hours) return;
        setSubmitting(true);
        try {
            await logTaskHours(task.id, parseInt(hours));
            setHours("");
            handleUpdate();
        } finally {
            setSubmitting(false);
        }
    }

    const statusStyle = STATUS_STYLE[task.status] || STATUS_STYLE.TODO;
    const priorityStyle = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.LOW;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-200 bg-white sticky top-0 z-10">
                <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {task.status.replace("_", " ")}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
                            {task.priority}
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h2>
                </div>
                <button
                    onClick={handleClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                {/* Description */}
                {task.description && (
                    <div className="px-5 py-4 border-b border-slate-100">
                        <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
                    </div>
                )}

                {/* Metadata */}
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-xs text-slate-400 mb-0.5">Assigned To</p>
                            <div className="flex items-center gap-1.5">
                                {task.assignee?.name ? (
                                    <>
                                        <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-semibold text-indigo-600">{task.assignee.name[0]}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800">{task.assignee.name}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Unassigned</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-xs text-slate-400 mb-0.5">Estimated</p>
                            <p className="text-sm font-semibold text-slate-800">{task.estimatedHours ? `${task.estimatedHours}h` : "—"}</p>
                        </div>
                    </div>
                </div>

                {/* Log Work */}
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Log Work</h3>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                placeholder="Hours spent"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                min="0"
                                step="0.5"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                            />
                        </div>
                        <button
                            onClick={handleLogHours}
                            disabled={submitting || !hours}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            {submitting ? "..." : "Log"}
                        </button>
                    </div>
                </div>

                {/* Risks */}
                {task.risks?.length > 0 && (
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Detected Risks
                        </h3>
                        <div className="space-y-2">
                            {task.risks.map((risk: any) => (
                                <div key={risk.id} className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                                    <span className="text-xs font-semibold text-rose-700">{risk.type}</span>
                                    <p className="text-xs text-rose-600 mt-0.5">{risk.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comments */}
                <div className="px-5 py-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Updates & Comments</h3>

                    {/* Comment input */}
                    <div className="mb-4">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add an update or comment..."
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition resize-none"
                            rows={3}
                        />
                        <button
                            onClick={handleComment}
                            disabled={submitting || !comment.trim()}
                            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            {submitting ? "Posting..." : "Post Update"}
                        </button>
                    </div>

                    {/* Comment list */}
                    <div className="space-y-2">
                        {task.updates?.map((update: any) => (
                            <div key={update.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-semibold text-indigo-600">{update.user?.name?.[0] || "?"}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700">{update.user?.name}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(update.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {update.comment && <p className="text-xs text-slate-600">{update.comment}</p>}
                                {update.newStatus && (
                                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-1 font-medium">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                        </svg>
                                        {update.newStatus.replace("_", " ")}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
