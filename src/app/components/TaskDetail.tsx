"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { addTaskComment, logTaskHours, assignTask } from "@/app/actions/tasks";
import { prisma } from "@/app/lib/prisma";

interface TaskDetailProps {
    task: any;
    onUpdate?: () => void;
    onClose?: () => void;
}

export function TaskDetail({ task, onUpdate, onClose }: TaskDetailProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [comment, setComment] = useState("");
    const [hours, setHours] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function handleUpdate() {
        if (onUpdate) {
            onUpdate();
        } else {
            router.refresh();
        }
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

    // Submit comment
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

    // Log hours spent
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

    return (
        <div className="max-w-2xl mx-auto p-6 relative">
            {/* Close Button */}
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Task header */}
            <h1 className="text-3xl font-bold mb-2 pr-8">{task.title}</h1>
            <p className="text-gray-600 mb-4">{task.description}</p>

            {/* Task info grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded">
                <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p className="font-semibold">{task.status}</p>
                </div>
                <div>
                    <label className="text-sm text-gray-600">Priority</label>
                    <p className="font-semibold">{task.priority}</p>
                </div>
                <div>
                    <label className="text-sm text-gray-600">Assigned To</label>
                    <p className="font-semibold">{task.assignee?.name || "Unassigned"}</p>
                </div>
                <div>
                    <label className="text-sm text-gray-600">Estimated Hours</label>
                    <p className="font-semibold">{task.estimatedHours}h</p>
                </div>
            </div>

            {/* Log hours */}
            <div className="mb-6 bg-blue-50 p-4 rounded">
                <h3 className="font-bold mb-2">Log Work</h3>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Hours spent..."
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                    />
                    <button
                        onClick={handleLogHours}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {submitting ? "Logging..." : "Log Hours"}
                    </button>
                </div>
            </div>

            {/* Comments section */}
            <div className="mb-6">
                <h3 className="font-bold mb-4">Updates & Comments</h3>

                {/* Comment input */}
                <div className="mb-4">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add an update..."
                        className="w-full px-3 py-2 border rounded mb-2"
                        rows={3}
                    />
                    <button
                        onClick={handleComment}
                        disabled={submitting}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        {submitting ? "Posting..." : "Post Update"}
                    </button>
                </div>

                {/* Comment list */}
                <div className="space-y-3">
                    {task.updates.map((update: any) => (
                        <div key={update.id} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-start">
                                <strong className="text-sm">{update.user.name}</strong>
                                <span className="text-xs text-gray-600">
                                    {new Date(update.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm mt-1">{update.comment}</p>
                            {update.newStatus && (
                                <span className="text-xs text-blue-600 mt-1">
                                    → {update.newStatus}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Risks section */}
            {task.risks.length > 0 && (
                <div className="bg-red-50 p-4 rounded">
                    <h3 className="font-bold mb-2 text-red-900">Detected Risks</h3>
                    {task.risks.map((risk: any) => (
                        <div key={risk.id} className="text-sm text-red-800 mb-2">
                            <strong>{risk.type}</strong>: {risk.description}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}