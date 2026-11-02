import React, { useState } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { calculateWeeklyReport } from '../core/engine';
import { AppDatabaseState } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface ReportsViewProps {
  state: AppDatabaseState;
  onGenerateAIReport: () => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state, onGenerateAIReport }) => {
  const report = calculateWeeklyReport(state);
  const [generating, setGenerating] = useState(false);
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('all');
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

      {/* 6 Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500">Completion Rate</span>
          <div
            className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums"
            data-testid="report-completion-rate"
          >
            {report.metrics.completionRate}%
          </div>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            {report.metrics.completedTasks} of {report.metrics.totalTasks} tasks
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500">Completed Tasks</span>
          <div
            className="mt-1 text-2xl font-bold text-emerald-700 font-mono tabular-nums"
            data-testid="report-completed-count"
          >
            {report.metrics.completedTasks}
          </div>
          <span className="text-[11px] text-slate-500">Verified closed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500">Overdue Items</span>
          <div
            className="mt-1 text-2xl font-bold text-red-600 font-mono tabular-nums"
            data-testid="report-overdue-count"
          >
            {report.metrics.overdueTasks}
          </div>
          <span className="text-[11px] text-slate-500">Past target deadline</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500">Carried Forward</span>
          <div
            className="mt-1 text-2xl font-bold text-indigo-600 font-mono tabular-nums"
            data-testid="report-carried-count"
          >
            {report.metrics.carriedForwardCount}
          </div>
          <span className="text-[11px] text-slate-500">Follow-up lineage</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500">Decisions Logged</span>
          <div
            className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums"
            data-testid="report-decisions-count"
          >
            {report.metrics.totalDecisions}
          </div>
          <span className="text-[11px] text-slate-500">
            Across {report.metrics.totalMeetings} meetings
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500">Meeting-to-Task Ratio</span>
          <div
            className="mt-1 text-2xl font-bold text-violet-700 font-mono tabular-nums"
            data-testid="report-conversion-ratio"
          >
            {tasksPerMeetingRatio}
          </div>
          <span className="text-[11px] text-slate-500">Tasks extracted / mtg</span>
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
