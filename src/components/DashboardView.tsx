import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CornerDownRight,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { calculateDashboardMetrics, calculateWeeklyReport } from '../core/engine';
import { AppDatabaseState } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface DashboardViewProps {
  state: AppDatabaseState;
  onNavigate: (tab: string, contextMeetingId?: string) => void;
  onToggleTaskStatus: (taskId: string, nextStatus: 'pending' | 'completed') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onToggleTaskStatus,
}) => {
  const metrics = calculateDashboardMetrics(state);
  const report = calculateWeeklyReport(state);

  const overdueTasks = state.tasks.filter((t) => t.status === 'overdue');
  const pendingTasks = state.tasks.filter((t) => t.status === 'pending');

  return (
    <div className="space-y-8" data-testid="dashboard-view">
      {/* Top KPI Summary Strip — 4 primary metrics + completion rate */}
      <section aria-label="Key Performance Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Meetings</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div
              className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums"
              data-testid="metric-total-meetings"
            >
              {metrics.totalMeetings}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span>{metrics.totalDecisions} decisions logged</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('meetings')}
                className="text-blue-600 hover:underline font-medium"
              >
                View records
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Open Action Items</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div
              className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums"
              data-testid="metric-open-tasks"
            >
              {metrics.openTasks}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="font-mono tabular-nums">{metrics.pendingTasks} scheduled</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-red-700 font-medium">
                {metrics.overdueTasks} overdue
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Completed Tasks</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div
              className="mt-2 text-3xl font-bold text-emerald-700 font-mono tabular-nums"
              data-testid="metric-completed-tasks"
            >
              {metrics.completedTasks}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="font-mono tabular-nums">{metrics.completionRate}% completion rate</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">of {metrics.totalTasks} total</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Overdue Tasks &amp; Blockers</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div
              className="mt-2 text-3xl font-bold text-red-700 font-mono tabular-nums"
              data-testid="metric-overdue-tasks"
            >
              {metrics.overdueTasks}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="font-mono tabular-nums">{metrics.activeBlockers} active blocker</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('carry-forward')}
                className="text-blue-600 hover:underline font-medium"
              >
                Carry forward
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Progress & Task Completion Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Task Progress Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Weekly Execution &amp; Completion Velocity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of completed vs. open and overdue action items across weekly review cycles
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-600 inline-block rounded-xs" />
                Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-600 inline-block rounded-xs" />
                Open
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-600 inline-block rounded-xs" />
                Overdue
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4 items-end h-44 pt-4 px-2">
            {report.weeklyTrend.map((week) => {
              const maxVal = Math.max(
                8,
                ...report.weeklyTrend.map((w) => Math.max(w.completed, w.opened, w.overdue))
              );
              const compH = Math.max(10, Math.round((week.completed / maxVal) * 120));
              const openH = Math.max(10, Math.round((week.opened / maxVal) * 120));
              const overH =
                week.overdue > 0 ? Math.max(10, Math.round((week.overdue / maxVal) * 120)) : 4;

              return (
                <div key={week.weekLabel} className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-2 h-32 w-full justify-center border-b border-slate-200 pb-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-mono tabular-nums text-emerald-700 font-medium">
                        {week.completed}
                      </span>
                      <div
                        style={{ height: `${compH}px` }}
                        className="w-5 bg-emerald-600 rounded-t transition-all"
                        title={`Completed: ${week.completed}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-mono tabular-nums text-blue-700 font-medium">
                        {week.opened}
                      </span>
                      <div
                        style={{ height: `${openH}px` }}
                        className="w-5 bg-blue-600 rounded-t transition-all"
                        title={`Open: ${week.opened}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-mono tabular-nums text-red-700 font-medium">
                        {week.overdue}
                      </span>
                      <div
                        style={{ height: `${overH}px` }}
                        className={`w-5 rounded-t transition-all ${
                          week.overdue > 0 ? 'bg-red-600' : 'bg-slate-200'
                        }`}
                        title={`Overdue: ${week.overdue}`}
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

        {/* Owner Workload & Completion Distribution */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Ownership &amp; Accountability Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Task status distribution across team members
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                {metrics.completionRate}% overall
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {report.byOwner.map((entry) => {
                const compPct =
                  entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;
                const pendPct =
                  entry.total > 0 ? Math.round((entry.pending / entry.total) * 100) : 0;
                const overPct = Math.max(0, 100 - compPct - pendPct);

                return (
                  <div key={entry.owner} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ParticipantAvatar
                          name={entry.owner}
                          participants={state.participants}
                          size="sm"
                        />
                        <span className="font-medium text-slate-900">{entry.owner}</span>
                      </div>
                      <div className="text-slate-500 font-mono tabular-nums">
                        <span>{entry.completed} done</span>
                        <span aria-hidden="true"> · </span>
                        <span>{entry.pending} pending</span>
                        {entry.overdue > 0 && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="text-red-700 font-medium">
                              {entry.overdue} overdue
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      {compPct > 0 && (
                        <div
                          style={{ width: `${compPct}%` }}
                          className="bg-emerald-600 h-full"
                        />
                      )}
                      {pendPct > 0 && (
                        <div style={{ width: `${pendPct}%` }} className="bg-blue-600 h-full" />
                      )}
                      {overPct > 0 && (
                        <div style={{ width: `${overPct}%` }} className="bg-red-600 h-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Carried forward across meetings:{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {metrics.carriedForwardCount}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              Open Full Report
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Two-Column Operational Split: Meetings & Decisions vs Priority Action Items */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Meetings & Recent Decisions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Meeting Sessions &amp; AI Extraction Status
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a meeting to inspect transcripts, decisions, or run AI extraction
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('meetings')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Manage Meetings
              </button>
            </div>

            <div className="divide-y divide-slate-200">
              {state.meetings.map((mtg) => {
                const mtgTasks = state.tasks.filter(
                  (t) => t.currentMeetingId === mtg.id || t.sourceMeetingId === mtg.id
                );
                const isAnalyzed = Boolean(mtg.aiSummary);
                return (
                  <div key={mtg.id} className="p-5 hover:bg-slate-50/80 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-900">{mtg.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span className="font-mono tabular-nums whitespace-nowrap">
                            {mtg.date} · {mtg.startTime}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="whitespace-nowrap">
                            {mtg.participants.length} participants
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums whitespace-nowrap">
                            {mtgTasks.length} linked tasks
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`whitespace-nowrap ${
                              isAnalyzed
                                ? 'text-emerald-700 font-medium'
                                : 'text-amber-700 font-medium'
                            }`}
                          >
                            {isAnalyzed ? 'AI Summary Verified' : 'Ready for AI Analysis'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onNavigate('ai-assistant', mtg.id)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isAnalyzed ? 'Re-Analyze' : 'Analyze Transcript'}
                        </button>
                      </div>
                    </div>

                    {mtg.aiSummary ? (
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200/80">
                        {mtg.aiSummary}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">{mtg.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decisions & Active Blockers */}
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Recent Decisions &amp; Active Blockers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Source-verified commitments and escalated operational risks
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {state.decisions.length} decisions · {state.blockers.length} blockers
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {state.blockers.map((blk) => (
                <div key={blk.id} className="p-4 bg-red-50/40">
                  <div className="flex items-center gap-2 text-xs text-red-700 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Active Blocker ({blk.severity} Severity)</span>
                    <span aria-hidden="true">·</span>
                    <span>Owner: {blk.owner}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{blk.reportedAt}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-900 font-medium">{blk.description}</p>
                  <p className="mt-1 text-xs text-slate-500">Source: {blk.meetingTitle}</p>
                </div>
              ))}

              {state.decisions.map((dec) => (
                <div key={dec.id} className="p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-700">Decision</span>
                    <span aria-hidden="true">·</span>
                    <span>Approved by {dec.owner}</span>
                    <span aria-hidden="true">·</span>
                    <span>{dec.impactArea}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{dec.date}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-900">{dec.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Attention Required (Overdue & Pending Action Items) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Action Items Requiring Attention
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Overdue and upcoming commitments across meetings
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap shrink-0"
            >
              All {state.tasks.length} Tasks
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {[...overdueTasks, ...pendingTasks].map((task) => {
              const isOverdue = task.status === 'overdue';
              const wasCarried = task.carriedFromMeetingIds.length > 0;
              return (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={
                            isOverdue
                              ? 'text-red-700 font-semibold'
                              : 'text-amber-700 font-medium'
                          }
                        >
                          {isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-slate-600">{task.priority} Priority</span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="font-mono tabular-nums text-slate-600">
                          Due {task.deadline}
                        </span>
                      </div>

                      <h3 className="text-sm font-medium text-slate-900">{task.title}</h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                        <span>Owner: {task.owner}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[220px]" title={task.sourceMeetingTitle}>
                          Origin: {task.sourceMeetingTitle.split('—')[0].trim()}
                        </span>
                      </div>

                      {wasCarried && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-700 pt-1">
                          <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Carried into: {task.currentMeetingTitle.split('—')[1]?.trim() || task.currentMeetingTitle}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleTaskStatus(task.id, 'completed')}
                      aria-label={`Complete task "${task.title}"`}
                      className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              );
            })}

            {overdueTasks.length === 0 && pendingTasks.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-900">All tasks are completed</p>
                <p className="text-xs text-slate-500 mt-1">
                  No overdue or pending items remain open.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
