import React, { useMemo, useState } from 'react';
import {
  Activity,
  Check,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { calculateWeeklyReport } from '../core/engine';
import { AppDatabaseState } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface ReportsViewProps {
  state: AppDatabaseState;
  onGenerateAIReport: () => Promise<void>;
}

export interface TimelineDayPoint {
  date: string;
  label: string;
  movedToCompleted: number;
  newlyPending: number;
  activePendingBalance: number;
  cumulativeCompleted: number;
  completedTaskTitles: string[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state, onGenerateAIReport }) => {
  const report = calculateWeeklyReport(state);
  const [generating, setGenerating] = useState(false);
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('all');
  const [timelineWindow, setTimelineWindow] = useState<'30d' | '14d' | '7d'>('30d');
  const [editableReportText, setEditableReportText] = useState<string>(
    report.aiExecutiveNarrative || ''
  );
  const [exportedFeedback, setExportedFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    setEditableReportText(report.aiExecutiveNarrative || '');
  }, [report.aiExecutiveNarrative, state.tasks.length, state.carryForwardHistory.length]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerateAIReport();
    } finally {
      setGenerating(false);
    }
  };

  const handleExportMarkdown = () => {
    const md = `# SyncMind AI — Weekly Operations & Workflow Report
Scenario: ${state.scenarioName}

## 1. Key Metrics Summary
- Total Meetings: ${report.metrics.totalMeetings}
- Total Action Items: ${report.metrics.totalTasks}
- Completed Tasks: ${report.metrics.completedTasks} (${report.metrics.completionRate}% completion rate)
- Open Tasks: ${report.metrics.openTasks} (${report.metrics.pendingTasks} pending, ${report.metrics.overdueTasks} overdue)
- Carried-Forward Tasks: ${report.metrics.carriedForwardCount}
- Active Blockers: ${report.metrics.activeBlockers}

## 2. Executive AI Narrative
${editableReportText}

## 3. Overdue Action Items (${report.overdueItems.length})
${report.overdueItems.map((t) => `- [${t.priority}] ${t.title} — Owner: ${t.owner} (Due: ${t.deadline})`).join('\n') || '- None'}

## 4. Formal Decisions Logged (${report.recentDecisions.length})
${report.recentDecisions.map((d) => `- ${d.summary} (${d.owner}, ${d.date})`).join('\n')}

## 5. Carry-Forward Audit Log (${report.carryForwardSummary.length})
${report.carryForwardSummary.map((cf) => `- "${cf.taskTitle}" carried from "${cf.originalMeetingTitle}" into "${cf.toMeetingTitle}" (${cf.owner})`).join('\n') || '- None'}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncmind-weekly-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportedFeedback('Exported Markdown report (.md)');
    setTimeout(() => setExportedFeedback(null), 4000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncmind-weekly-report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportedFeedback('Exported structured JSON report (.json)');
    setTimeout(() => setExportedFeedback(null), 4000);
  };

  // Real calculated Meeting-to-Task Conversion Ratio
  const tasksPerMeetingRatio = (
    report.metrics.totalTasks / Math.max(1, report.metrics.totalMeetings)
  ).toFixed(1);

  const visibleWeeklyTrends =
    selectedCycleFilter === 'all'
      ? report.weeklyTrend
      : report.weeklyTrend.filter((w) => w.weekLabel === selectedCycleFilter);

  // Build 30-Day Task Completion Timeline (Pending -> Completed transitions & Delivery Velocity)
  const thirtyDayTimeline = useMemo<TimelineDayPoint[]>(() => {
    const refDateStr = state.referenceDate || '2026-11-02';
    const refTime = new Date(`${refDateStr}T12:00:00Z`).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Historical Q4 cycle baseline events prior to the Oct 28 meeting window
    // Matches the weekly trend cycles: Oct 12 (3 completed, 4 opened), Oct 19 (4 completed, 5 opened), Oct 26 (2 completed, 4 opened)
    const historicalPriorSeeds: Record<
      string,
      { opened: number; completed: number; titles: string[] }
    > = {
      '2026-10-05': { opened: 2, completed: 0, titles: [] },
      '2026-10-07': {
        opened: 2,
        completed: 1,
        titles: ['Baseline vector index provisioning for Gurugram sandbox'],
      },
      '2026-10-10': {
        opened: 0,
        completed: 2,
        titles: [
          'Configure Azure OpenAI private endpoint routing',
          'Draft initial BFSI prompt redaction policy',
        ],
      },
      '2026-10-13': { opened: 3, completed: 1, titles: ['Verify RBAC claims on ingestion API'] },
      '2026-10-16': {
        opened: 2,
        completed: 2,
        titles: [
          'Complete latency load-test on 50k BFSI document corpus',
          'Review SOC2 & ISO 42001 logging schema',
        ],
      },
      '2026-10-18': {
        opened: 0,
        completed: 1,
        titles: ['Sign off Q3 model hallucination audit'],
      },
      '2026-10-21': { opened: 2, completed: 1, titles: ['Deploy Redis citation cache layer'] },
      '2026-10-24': {
        opened: 2,
        completed: 1,
        titles: ['Update Partner Steering deck with Q4 SLA targets'],
      },
    };

    const days: {
      date: string;
      label: string;
      movedToCompleted: number;
      newlyPending: number;
      completedTaskTitles: string[];
    }[] = [];

    const dateIndexMap = new Map<string, number>();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(refTime - i * dayMs);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        timeZone: 'UTC',
      });
      const hist = historicalPriorSeeds[iso];
      dateIndexMap.set(iso, days.length);
      days.push({
        date: iso,
        label,
        movedToCompleted: hist ? hist.completed : 0,
        newlyPending: hist ? hist.opened : 0,
        completedTaskTitles: hist ? [...hist.titles] : [],
      });
    }

    // Layer live workspace tasks and statusHistory transitions (Pending -> Completed)
    for (const task of state.tasks) {
      const createdIso = (task.createdAt || refDateStr).slice(0, 10);
      const targetCreatedIdx = dateIndexMap.has(createdIso)
        ? dateIndexMap.get(createdIso)!
        : days.length - 1;
      days[targetCreatedIdx].newlyPending += 1;

      // Inspect statusHistory for transitions from pending/in-progress/overdue -> completed
      const completionEntries = (task.statusHistory || []).filter(
        (h) => h.toStatus === 'completed'
      );

      if (completionEntries.length > 0) {
        const latestCompletion = completionEntries[completionEntries.length - 1];
        const compIso = latestCompletion.timestamp.slice(0, 10);
        const targetCompIdx = dateIndexMap.has(compIso)
          ? dateIndexMap.get(compIso)!
          : days.length - 1;
        if (task.status === 'completed') {
          days[targetCompIdx].movedToCompleted += 1;
          days[targetCompIdx].completedTaskTitles.push(task.title);
        }
      } else if (task.status === 'completed') {
        const compIso = (task.completedAt || refDateStr).slice(0, 10);
        const targetCompIdx = dateIndexMap.has(compIso)
          ? dateIndexMap.get(compIso)!
          : days.length - 1;
        days[targetCompIdx].movedToCompleted += 1;
        days[targetCompIdx].completedTaskTitles.push(task.title);
      }
    }

    let runningPending = 1;
    let cumulativeCompleted = 0;

    return days.map((day) => {
      runningPending = Math.max(0, runningPending + day.newlyPending - day.movedToCompleted);
      cumulativeCompleted += day.movedToCompleted;
      return {
        ...day,
        activePendingBalance: runningPending,
        cumulativeCompleted,
      };
    });
  }, [state.tasks, state.referenceDate]);

  const visibleTimeline = useMemo(() => {
    if (timelineWindow === '7d') return thirtyDayTimeline.slice(-7);
    if (timelineWindow === '14d') return thirtyDayTimeline.slice(-14);
    return thirtyDayTimeline;
  }, [thirtyDayTimeline, timelineWindow]);

  const velocitySummary = useMemo(() => {
    const totalMovedToCompleted30d = thirtyDayTimeline.reduce(
      (sum, d) => sum + d.movedToCompleted,
      0
    );
    const totalNewlyPending30d = thirtyDayTimeline.reduce((sum, d) => sum + d.newlyPending, 0);
    const windowMovedToCompleted = visibleTimeline.reduce(
      (sum, d) => sum + d.movedToCompleted,
      0
    );
    const weeklyAvgVelocity = (totalMovedToCompleted30d / (30 / 7)).toFixed(1);

    // Calculate average cycle time in days for completed tasks in state.tasks
    const completedWithTimestamps = state.tasks.filter(
      (t) => t.status === 'completed' && t.createdAt && t.completedAt
    );
    let avgCycleDays = '2.2';
    if (completedWithTimestamps.length > 0) {
      const totalDays = completedWithTimestamps.reduce((acc, t) => {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.completedAt!).getTime();
        return acc + Math.max(0.5, (end - start) / (1000 * 60 * 60 * 24));
      }, 0);
      avgCycleDays = (totalDays / completedWithTimestamps.length).toFixed(1);
    }

    return {
      totalMovedToCompleted30d,
      totalNewlyPending30d,
      windowMovedToCompleted,
      weeklyAvgVelocity,
      avgCycleDays,
    };
  }, [thirtyDayTimeline, visibleTimeline, state.tasks]);

  return (
    <div className="space-y-6" data-testid="reports-view">
      {/* Header & Export Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
            Reports &amp; Executive Analytics
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Weekly Execution, Conversion &amp; Continuity Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live synthesis of meeting frequency, action-item completion trends, ownership
            distribution, and follow-up lineage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <select
              aria-label="Filter report cycle"
              value={selectedCycleFilter}
              onChange={(e) => setSelectedCycleFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Weekly Cycles (Q4)</option>
              {report.weeklyTrend.map((w) => (
                <option key={w.weekLabel} value={w.weekLabel}>
                  Cycle: {w.weekLabel}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            data-testid="generate-ai-report-btn"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Synthesizing Report...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Refresh AI Executive Narrative
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Markdown
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {exportedFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{exportedFeedback}</span>
        </div>
      )}

      {/* Feature F — Comprehensive Meeting & Workflow Analytics KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500">Total Meetings</span>
          <div
            className="mt-1 text-xl font-bold text-slate-900 font-mono tabular-nums"
            data-testid="report-total-meetings"
          >
            {report.metrics.totalMeetings}
          </div>
          <span className="text-[10px] text-slate-500 font-mono tabular-nums">
            {tasksPerMeetingRatio} tasks / mtg
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500">Decisions Recorded</span>
          <div
            className="mt-1 text-xl font-bold text-slate-900 font-mono tabular-nums"
            data-testid="report-decisions-count"
          >
            {report.metrics.totalDecisions}
          </div>
          <span className="text-[10px] text-slate-500">Source-verified</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500">Action Items Gen.</span>
          <div
            className="mt-1 text-xl font-bold text-indigo-700 font-mono tabular-nums"
            data-testid="report-total-tasks"
          >
            {report.metrics.totalTasks}
          </div>
          <span className="text-[10px] text-slate-500">Total extracted</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500">Open Action Items</span>
          <div
            className="mt-1 text-xl font-bold text-amber-700 font-mono tabular-nums"
            data-testid="report-open-tasks"
          >
            {report.metrics.openTasks}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {report.metrics.pendingTasks} active
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500">Completed Tasks</span>
          <div
            className="mt-1 text-xl font-bold text-emerald-700 font-mono tabular-nums"
            data-testid="report-completed-count"
          >
            {report.metrics.completedTasks}
          </div>
          <span
            className="text-[10px] text-slate-500 font-mono"
            data-testid="report-completion-rate"
          >
            {report.metrics.completionRate}% rate
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500">Overdue Tasks</span>
          <div
            className="mt-1 text-xl font-bold text-red-600 font-mono tabular-nums"
            data-testid="report-overdue-count"
          >
            {report.metrics.overdueTasks}
          </div>
          <span className="text-[10px] text-slate-500">Past due date</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500">Carried Follow-Ups</span>
          <div
            className="mt-1 text-xl font-bold text-indigo-600 font-mono tabular-nums"
            data-testid="report-carried-count"
          >
            {report.metrics.carriedForwardCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {report.metrics.followUpCompletionRate ?? report.metrics.completionRate}% follow-up rate
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500">Task / Mtg Ratio</span>
          <div
            className="mt-1 text-xl font-bold text-violet-700 font-mono tabular-nums"
            data-testid="report-conversion-ratio"
          >
            {tasksPerMeetingRatio}
          </div>
          <span className="text-[10px] text-slate-500">Avg items / sync</span>
        </div>
      </div>

      {/* 30-Day Task Completion Timeline & Delivery Velocity (Recharts Visualization) */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5"
        data-testid="reports-30d-velocity-chart"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-semibold inline-flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Delivery Velocity Telemetry · 30-Day Rolling Window
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              30-Day Task Completion Timeline (Pending → Completed Progression)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks daily tasks transitioning from <strong>Pending</strong> to{' '}
              <strong>Completed</strong> alongside active queue balance and cumulative delivery
              velocity ({thirtyDayTimeline[0]?.label} –{' '}
              {thirtyDayTimeline[thirtyDayTimeline.length - 1]?.label})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs"
              role="group"
              aria-label="Select velocity timeline window"
            >
              {(
                [
                  { id: '30d', label: 'Last 30 Days' },
                  { id: '14d', label: 'Last 14 Days' },
                  { id: '7d', label: 'Last 7 Days' },
                ] as const
              ).map((win) => (
                <button
                  key={win.id}
                  type="button"
                  onClick={() => setTimelineWindow(win.id)}
                  data-testid={`velocity-window-${win.id}`}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    timelineWindow === win.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {win.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Velocity KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
            <div className="text-[11px] text-emerald-800 font-medium">
              Moved Pending → Completed (30d)
            </div>
            <div
              className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5"
              data-testid="velocity-30d-completed-total"
            >
              {velocitySummary.totalMovedToCompleted30d} tasks
            </div>
            <div className="text-[10px] text-emerald-700/80 font-mono mt-0.5">
              {velocitySummary.windowMovedToCompleted} in selected {timelineWindow} window
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-200/80">
            <div className="text-[11px] text-indigo-900 font-medium">
              Newly Queued into Pending (30d)
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-indigo-700 mt-0.5">
              {velocitySummary.totalNewlyPending30d} tasks
            </div>
            <div className="text-[10px] text-indigo-700/80 font-mono mt-0.5">
              Ingested &amp; extracted from syncs
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-600 font-medium">
              Weekly Delivery Velocity
            </div>
            <div
              className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5"
              data-testid="velocity-weekly-avg"
            >
              {velocitySummary.weeklyAvgVelocity} / wk
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Rolling 30-day throughput
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-600 font-medium">
              Avg. Pending → Completed Cycle
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {velocitySummary.avgCycleDays} days
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Mean resolution time
            </div>
          </div>
        </div>

        {/* Recharts ComposedChart: Pending -> Completed Transitions + Cumulative Velocity */}
        <div className="h-72 w-full pt-2" data-testid="recharts-velocity-container">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={visibleTimeline}
              margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cumulativeVelocityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={timelineWindow === '30d' ? 2 : 0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0].payload as TimelineDayPoint;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-700 text-xs space-y-1.5 max-w-xs">
                      <div className="font-mono font-semibold text-indigo-300 border-b border-slate-700 pb-1">
                        {point.label} ({point.date})
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-emerald-300">Moved Pending → Completed:</span>
                        <span className="font-mono font-bold">{point.movedToCompleted}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-indigo-300">Newly Added to Pending:</span>
                        <span className="font-mono font-bold">{point.newlyPending}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-amber-300">Active Pending Queue:</span>
                        <span className="font-mono font-bold">{point.activePendingBalance}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1">
                        <span className="text-slate-300">30d Cumulative Completed:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {point.cumulativeCompleted}
                        </span>
                      </div>
                      {point.completedTaskTitles.length > 0 && (
                        <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-300">
                          <span className="font-semibold text-emerald-300 block mb-0.5">
                            Completed Deliverables:
                          </span>
                          {point.completedTaskTitles.map((title, idx) => (
                            <div key={idx} className="truncate">
                              • {title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="cumulativeCompleted"
                name="Cumulative Completed (Velocity)"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cumulativeVelocityFill)"
              />
              <Bar
                dataKey="movedToCompleted"
                name="Moved Pending → Completed (Daily)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
              <Bar
                dataKey="newlyPending"
                name="Newly Added to Pending"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
              <Line
                type="monotone"
                dataKey="activePendingBalance"
                name="Active Pending Queue"
                stroke="#d97706"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#d97706' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action-Item Completion Trends & Meeting Conversion Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Action-Item Completion Trends &amp; Follow-Up Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Weekly breakdown of completed, newly opened, and overdue tasks
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-600 inline-block rounded-xs" />
                Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-600 inline-block rounded-xs" />
                Opened
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-600 inline-block rounded-xs" />
                Overdue
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4 items-end h-40 pt-4 px-2">
            {visibleWeeklyTrends.map((week) => {
              const maxVal = Math.max(
                8,
                ...report.weeklyTrend.map((w) => Math.max(w.completed, w.opened, w.overdue))
              );
              const compH = Math.max(10, Math.round((week.completed / maxVal) * 110));
              const openH = Math.max(10, Math.round((week.opened / maxVal) * 110));
              const overH =
                week.overdue > 0 ? Math.max(10, Math.round((week.overdue / maxVal) * 110)) : 4;

              return (
                <div key={week.weekLabel} className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-2 h-28 w-full justify-center border-b border-slate-200 pb-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-mono tabular-nums text-emerald-700 font-medium">
                        {week.completed}
                      </span>
                      <div
                        style={{ height: `${compH}px` }}
                        className="w-5 bg-emerald-600 rounded-t transition-all"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-mono tabular-nums text-indigo-600 font-medium">
                        {week.opened}
                      </span>
                      <div
                        style={{ height: `${openH}px` }}
                        className="w-5 bg-indigo-600 rounded-t transition-all"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-mono tabular-nums text-red-600 font-medium">
                        {week.overdue}
                      </span>
                      <div
                        style={{ height: `${overH}px` }}
                        className={`w-5 rounded-t transition-all ${
                          week.overdue > 0 ? 'bg-red-600' : 'bg-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 font-mono tabular-nums text-center">
                    {week.weekLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI-Written Executive Report (Reviewable & Editable) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              AI-Generated Executive Narrative
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Synthesized directly from stored meetings, tasks, carry-forward records, and blockers
            </p>
          </div>
          <textarea
            aria-label="Executive report narrative"
            rows={6}
            value={editableReportText}
            onChange={(e) => setEditableReportText(e.target.value)}
            className="w-full p-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Owner Performance Table & Overdue / Carry-Forward Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Task Ownership Distribution &amp; Completion Rate
            </h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Completed</th>
                <th className="py-3 px-4 text-right">Pending</th>
                <th className="py-3 px-4 text-right">Overdue</th>
                <th className="py-3 px-4 text-right">Completion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {report.byOwner.map((row) => (
                <tr key={row.owner} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <ParticipantAvatar
                        name={row.owner}
                        participants={state.participants}
                        size="sm"
                      />
                      <span className="font-medium text-slate-900">{row.owner}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                    {row.completed}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {row.pending}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-red-600 font-medium">
                    {row.overdue}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {row.completionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">
              Overdue Tasks &amp; Follow-Up Continuity Status
            </h3>
          </div>
          <div className="p-5 space-y-4 text-xs">
            <div>
              <h4 className="font-semibold text-red-800 mb-2">
                Overdue Deliverables ({report.overdueItems.length})
              </h4>
              {report.overdueItems.length > 0 ? (
                <ul className="space-y-2">
                  {report.overdueItems.map((item) => (
                    <li
                      key={item.id}
                      className="p-2.5 bg-red-50/40 border border-red-200 rounded-lg flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-medium text-slate-900 block">{item.title}</span>
                        <span className="text-slate-500">
                          Owner: {item.owner} · Source: {item.sourceMeetingTitle.split('—')[0]}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-red-600 shrink-0">
                        {item.deadline}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">Zero overdue items.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h4 className="font-semibold text-indigo-800 mb-2">
                Carried-Forward Follow-Ups ({report.carryForwardSummary.length})
              </h4>
              {report.carryForwardSummary.length > 0 ? (
                <ul className="space-y-2">
                  {report.carryForwardSummary.map((cf) => (
                    <li
                      key={cf.id}
                      className="p-2.5 bg-indigo-50/40 border border-indigo-200 rounded-lg space-y-0.5"
                    >
                      <span className="font-medium text-slate-900 block">{cf.taskTitle}</span>
                      <span className="text-slate-600 block">
                        Origin: {cf.originalMeetingTitle.split('—')[0]} → Carried to:{' '}
                        {cf.toMeetingTitle.split('—')[1] || cf.toMeetingTitle}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No carried-forward items recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
