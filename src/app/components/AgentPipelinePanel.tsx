"use client";

import { useEffect, useState, useCallback } from "react";

interface AgentLog {
    id: string;
    agentName: string;
    agentRole: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
    input?: string | null;
    output?: string | null;
    score?: number | null;
    durationMs?: number | null;
    tokensUsed?: number | null;
    error?: string | null;
    createdAt: string;
    completedAt?: string | null;
}

const AGENT_ORDER = [
    "Orchestrator",
    "PlanningAgent",
    "EvaluationAgent",
    "RefinementAgent",
    "DependencyAgent",
    "SprintPlannerAgent",
    "RiskAgent",
    "SummaryAgent",
];

const AGENT_ICONS: Record<string, string> = {
    Orchestrator:      "M13 10V3L4 14h7v7l9-11h-7z",
    PlanningAgent:     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    EvaluationAgent:   "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    RefinementAgent:   "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    DependencyAgent:   "M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4",
    SprintPlannerAgent:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    RiskAgent:         "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    SummaryAgent:      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
};

const AGENT_COLORS: Record<string, { ring: string; icon: string; badge: string }> = {
    Orchestrator:       { ring: "ring-violet-500", icon: "text-violet-600 bg-violet-100", badge: "bg-violet-100 text-violet-700" },
    PlanningAgent:      { ring: "ring-indigo-500", icon: "text-indigo-600 bg-indigo-100", badge: "bg-indigo-100 text-indigo-700" },
    EvaluationAgent:    { ring: "ring-blue-500",   icon: "text-blue-600 bg-blue-100",     badge: "bg-blue-100 text-blue-700" },
    RefinementAgent:    { ring: "ring-cyan-500",   icon: "text-cyan-600 bg-cyan-100",     badge: "bg-cyan-100 text-cyan-700" },
    DependencyAgent:    { ring: "ring-teal-500",   icon: "text-teal-600 bg-teal-100",     badge: "bg-teal-100 text-teal-700" },
    SprintPlannerAgent: { ring: "ring-emerald-500",icon: "text-emerald-600 bg-emerald-100", badge: "bg-emerald-100 text-emerald-700" },
    RiskAgent:          { ring: "ring-amber-500",  icon: "text-amber-600 bg-amber-100",   badge: "bg-amber-100 text-amber-700" },
    SummaryAgent:       { ring: "ring-rose-500",   icon: "text-rose-600 bg-rose-100",     badge: "bg-rose-100 text-rose-700" },
};

const STATUS_STYLE = {
    PENDING:   { dot: "bg-slate-300",  label: "bg-slate-100 text-slate-500",    text: "Pending" },
    RUNNING:   { dot: "bg-blue-500 animate-pulse", label: "bg-blue-100 text-blue-700", text: "Running" },
    COMPLETED: { dot: "bg-emerald-500", label: "bg-emerald-100 text-emerald-700", text: "Completed" },
    FAILED:    { dot: "bg-rose-500",    label: "bg-rose-100 text-rose-700",       text: "Failed" },
    SKIPPED:   { dot: "bg-slate-400",   label: "bg-slate-100 text-slate-600",     text: "Skipped" },
};

function formatDuration(ms?: number | null): string {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function AgentCard({ log, index }: { log: AgentLog; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const colors = AGENT_COLORS[log.agentName] || AGENT_COLORS.PlanningAgent;
    const statusStyle = STATUS_STYLE[log.status];
    const iconPath = AGENT_ICONS[log.agentName] || AGENT_ICONS.PlanningAgent;

    return (
        <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-all ${
            log.status === "RUNNING" ? `ring-2 ${colors.ring}` : ""
        }`}>
            <button
                className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Step number + icon */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.icon}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                        </svg>
                    </div>
                    {index < AGENT_ORDER.length - 1 && (
                        <div className="w-0.5 h-4 bg-slate-200" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                            {log.agentName.replace("Agent", " Agent")}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.label}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {statusStyle.text}
                        </span>
                        {log.score != null && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                Score: {log.score.toFixed(1)}/10
                            </span>
                        )}
                        {log.durationMs != null && (
                            <span className="text-xs text-slate-400 ml-auto">{formatDuration(log.durationMs)}</span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{log.agentRole}</p>

                    {log.status === "RUNNING" && (
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-blue-600">Processing...</span>
                        </div>
                    )}
                </div>

                {/* Expand chevron */}
                {(log.output || log.input || log.error) && (
                    <svg
                        className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                    {log.input && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Input</p>
                            <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3">{log.input}</p>
                        </div>
                    )}
                    {log.output && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Output</p>
                            <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3 whitespace-pre-wrap">{log.output}</p>
                        </div>
                    )}
                    {log.error && (
                        <div>
                            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">Error</p>
                            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{log.error}</p>
                        </div>
                    )}
                    {log.tokensUsed && (
                        <p className="text-xs text-slate-400">Tokens used: {log.tokensUsed.toLocaleString()}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export function AgentPipelinePanel({ projectId }: { projectId: string }) {
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await fetch(`/api/agents/logs/${projectId}`);
            if (!res.ok) return;
            const data = await res.json();
            setLogs(data.logs || []);

            // Check if any agents are still running
            const hasRunning = data.logs?.some(
                (l: AgentLog) => l.status === "RUNNING" || l.status === "PENDING"
            );
            setIsLive(hasRunning);
        } catch (e) {
            console.error("Failed to fetch agent logs:", e);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Poll while agents are running
    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(fetchLogs, 2000);
        return () => clearInterval(interval);
    }, [isLive, fetchLogs]);

    const completedCount = logs.filter((l) => l.status === "COMPLETED").length;
    const totalCount = logs.length;
    const overallStatus = logs.find((l) => l.agentName === "Orchestrator");
    const evaluationLog = logs.find((l) => l.agentName === "EvaluationAgent");

    // Sort by AGENT_ORDER
    const sortedLogs = [...logs].sort((a, b) => {
        const ai = AGENT_ORDER.indexOf(a.agentName);
        const bi = AGENT_ORDER.indexOf(b.agentName);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    if (loading) {
        return (
            <div className="p-6 flex items-center gap-3 text-slate-500">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Loading agent logs...
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="p-6 text-center text-slate-400 text-sm">
                No agent activity yet for this project.
            </div>
        );
    }

    return (
        <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Agent Pipeline</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {completedCount}/{totalCount} agents completed
                        {overallStatus?.durationMs && ` · ${formatDuration(overallStatus.durationMs)} total`}
                    </p>
                </div>
                {isLive && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Live
                    </div>
                )}
                {!isLive && overallStatus?.status === "COMPLETED" && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
                <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                </div>
            )}

            {/* Stats row */}
            {evaluationLog?.score != null && (
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-indigo-600">{evaluationLog.score.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">Plan Quality</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-emerald-600">
                            {logs.find((l) => l.agentName === "SprintPlannerAgent")?.output?.match(/\d+ sprints/)?.[0]?.replace(" sprints", "") || "—"}
                        </p>
                        <p className="text-xs text-slate-500">Sprints</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-amber-600">
                            {logs.find((l) => l.agentName === "RiskAgent")?.output?.match(/\d+/)?.[0] || "—"}
                        </p>
                        <p className="text-xs text-slate-500">Risks Found</p>
                    </div>
                </div>
            )}

            {/* Agent cards */}
            <div className="space-y-2">
                {sortedLogs.map((log, i) => (
                    <AgentCard key={log.id} log={log} index={i} />
                ))}
            </div>

            {/* Refresh button */}
            <button
                onClick={fetchLogs}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 flex items-center justify-center gap-1.5 transition-colors"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
            </button>
        </div>
    );
}
