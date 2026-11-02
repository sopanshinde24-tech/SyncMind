import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CornerDownRight,
  FileCheck2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { calculateDashboardMetrics, calculateWeeklyReport } from '../core/engine';
import { AppDatabaseState } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface DashboardViewProps {
  state: AppDatabaseState;
  onNavigate: (tab: string, contextMeetingId?: string) => void;
  onToggleTaskStatus: (taskId: string, nextStatus: 'pending' | 'completed') => void;
  onOpenCopilot?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onToggleTaskStatus,
  onOpenCopilot,
}) => {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  const metrics = calculateDashboardMetrics(state);
  const report = calculateWeeklyReport(state);

  // Calculate Meetings This Week based on actual meeting dates vs referenceDate ("2026-11-02")
  const refTime = new Date(state.referenceDate || '2026-11-02').getTime();
  const meetingsThisWeekCount = state.meetings.filter((m) => {
    const mtgTime = new Date(m.date).getTime();
    const diffDays = Math.abs(refTime - mtgTime) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  const pendingTransfersCount = state.handovers.filter(
    (h) => h.status === 'Pending Acknowledgment'
  ).length;

  const overdueTasks = state.tasks.filter(
    (t) =>
      t.status === 'overdue' &&
      (selectedMemberFilter === 'all' || t.owner === selectedMemberFilter)
  );
  const pendingTasks = state.tasks.filter(
    (t) =>
      t.status === 'pending' &&
      (selectedMemberFilter === 'all' || t.owner === selectedMemberFilter)
  );

  const filteredDecisions = state.decisions.filter(
    (d) => selectedMemberFilter === 'all' || d.owner === selectedMemberFilter
  );
  const filteredBlockers = state.blockers.filter(
    (b) => selectedMemberFilter === 'all' || b.owner === selectedMemberFilter
  );

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      {/* Interactive Team Lead Filter Strip */}
      <section
        aria-label="Multi-City Delivery Team Filter"
        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
      >
        <div className="space-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 font-mono">
            Operational Overview · Multi-City Delivery Hub
          </div>
          <p className="text-xs text-slate-500">
            Filter live action items, decisions, and blockers by delivery lead across Gurugram,
            Bengaluru, and Mumbai
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg"
          role="group"
          aria-label="Filter dashboard by team lead"
        >
          <button
            type="button"
            onClick={() => setSelectedMemberFilter('all')}
            data-testid="dashboard-filter-all"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedMemberFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Leads ({state.participants.length})
          </button>
          {state.participants.map((p) => {
            const isSelected = selectedMemberFilter === p.name;
            const city = p.department.split('·')[1]?.trim() || 'India';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedMemberFilter(p.name)}
                data-testid={`dashboard-filter-${p.id}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[11px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  · {city}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Top KPI Summary Strip — 6 Live Enterprise Metrics */}
      <section aria-label="Key Performance Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* 1. Total Meetings */}
          <div
            onClick={() => onNavigate('meetings')}
            className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-4 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Total Meetings</span>
              <Calendar className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <div
              className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums"
              data-testid="metric-total-meetings"
            >
              {metrics.totalMeetings}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{metrics.totalDecisions} decisions</span>
              <span className="text-indigo-600 font-medium group-hover:underline">Open</span>
            </div>
          </div>

          {/* 2. Meetings This Week */}
          <div
            onClick={() => onNavigate('meetings')}
            className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-4 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Meetings This Week</span>
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div
              className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums"
              data-testid="metric-meetings-this-week"
            >
              {meetingsThisWeekCount}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              <span>Ref week: {state.referenceDate}</span>
            </div>
          </div>

          {/* 3. Open Action Items */}
          <div
            onClick={() => onNavigate('tasks')}
            className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-4 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Open Action Items</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div
              className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums"
              data-testid="metric-open-tasks"
            >
              {metrics.openTasks}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              <span className="font-mono">{metrics.pendingTasks} scheduled</span>
            </div>
          </div>

          {/* 4. Completed Action Items */}
          <div
            onClick={() => onNavigate('reports')}
            className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-4 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Completed Items</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div
              className="mt-2 text-2xl font-bold text-emerald-700 font-mono tabular-nums"
              data-testid="metric-completed-tasks"
            >
              {metrics.completedTasks}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              <span className="font-mono">{metrics.completionRate}% completion rate</span>
            </div>
          </div>

          {/* 5. Overdue Tasks */}
          <div
            onClick={() => onNavigate('tasks')}
            className="bg-white border border-slate-200 hover:border-red-400 rounded-xl p-4 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Overdue Tasks</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div
              className="mt-2 text-2xl font-bold text-red-600 font-mono tabular-nums"
              data-testid="metric-overdue-tasks"
            >
              {metrics.overdueTasks}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              <span className="font-mono">{metrics.activeBlockers} active blocker(s)</span>
            </div>
          </div>

          {/* 6. Pending Work Transfers */}
          <div
            onClick={() => onNavigate('handover')}
            className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-4 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Pending Transfers</span>
              <Briefcase className="w-4 h-4 text-violet-600" />
            </div>
            <div
              className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums"
              data-testid="metric-pending-transfers"
            >
              {pendingTransfersCount}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              <span className="font-mono">
                {metrics.acknowledgedHandovers}/{metrics.totalHandovers} signed off
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Meeting & Execution Activity Chart + Ownership Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Weekly Meeting &amp; Action-Item Execution Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Completed vs. newly opened and overdue action items across weekly sync cycles
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
                      <span className="text-[11px] font-mono tabular-nums text-indigo-600 font-medium">
                        {week.opened}
                      </span>
                      <div
                        style={{ height: `${openH}px` }}
                        className="w-5 bg-indigo-600 rounded-t transition-all"
                        title={`Opened: ${week.opened}`}
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
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Delivery Ownership &amp; Workload
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Task status distribution across Advisory, Engineering, and Governance
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-indigo-600 font-semibold">
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
                const participant = state.participants.find((p) => p.name === entry.owner);

                return (
                  <div
                    key={entry.owner}
                    onClick={() =>
                      setSelectedMemberFilter((prev) =>
                        prev === entry.owner ? 'all' : entry.owner
                      )
                    }
                    className="space-y-1.5 cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ParticipantAvatar
                          name={entry.owner}
                          participants={state.participants}
                          size="sm"
                        />
                        <div>
                          <span className="font-medium text-slate-900">{entry.owner}</span>
                          {participant && (
                            <span className="text-[11px] text-slate-400 ml-1.5">
                              {participant.department.split('·')[1]?.trim()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-500 font-mono tabular-nums">
                        <span>{entry.completed} done</span>
                        <span aria-hidden="true"> · </span>
                        <span>{entry.pending} open</span>
                        {entry.overdue > 0 && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="text-red-600 font-medium">
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
                        <div style={{ width: `${pendPct}%` }} className="bg-indigo-600 h-full" />
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
              className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              Open Analytics Report
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Two-Column Operational Split: Recent Meetings, Decisions & Work Transfers vs Action Items Requiring Attention */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Recent Meetings, Decisions & Work Transfer Activity */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent Meetings */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent &amp; Scheduled Meetings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a meeting to inspect transcripts, decisions, or run AI extraction
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('meetings')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                All Meetings
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
                            className={`whitespace-nowrap font-medium ${
                              isAnalyzed ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {isAnalyzed ? 'AI Summary Verified' : 'Ready for AI Analysis'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onNavigate('meetings', mtg.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('ai-assistant', mtg.id)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                          {isAnalyzed ? 'Re-Analyze' : 'Analyze Transcript'}
                        </button>
                      </div>
                    </div>

                    {mtg.aiSummary ? (
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
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

          {/* Recent Decisions & Active Blockers */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent Decisions &amp; Active Blockers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Source-verified commitments and escalated compliance/engineering risks
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {filteredDecisions.length} decisions · {filteredBlockers.length} blockers
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredBlockers.map((blk) => (
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

              {filteredDecisions.map((dec) => (
                <div key={dec.id} className="p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
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

          {/* Work Transfer Activity */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Work Transfer Activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent cross-team handovers and continuity packages
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('handover')}
                className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                Open Work Transfers
              </button>
            </div>
            <div className="divide-y divide-slate-200">
              {state.handovers.map((ho) => (
                <div key={ho.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          ho.status === 'Acknowledged' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {ho.status}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-mono text-slate-600">
                        {ho.fromPerson} &rarr; {ho.toPerson}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{ho.title}</div>
                    <p className="text-xs text-slate-500 line-clamp-1">{ho.projectContext}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('handover')}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md shrink-0 cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Action Items Requiring Attention + AI Copilot Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Action Items Requiring Attention
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedMemberFilter === 'all'
                    ? 'Overdue and upcoming commitments across Gurugram, Bengaluru & Mumbai'
                    : `Filtered by owner: ${selectedMemberFilter}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="text-xs font-medium text-indigo-600 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
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
                                ? 'text-red-600 font-semibold'
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
                          <div className="flex items-center gap-1.5 text-xs text-indigo-600 pt-1 font-medium">
                            <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Carried into:{' '}
                              {task.currentMeetingTitle.split('—')[1]?.trim() ||
                                task.currentMeetingTitle}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(task.id, 'completed')}
                        aria-label={`Complete task "${task.title}"`}
                        className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Mark Complete
                      </button>
                    </div>
                  </div>
                );
              })}

              {overdueTasks.length === 0 && pendingTasks.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-slate-900">
                    No open tasks for this filter
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Select &ldquo;All Leads&rdquo; or create a new action item.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Enterprise AI Copilot Quick-Launch Card */}
          {onOpenCopilot && (
            <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold">Interactive SyncMind AI Copilot</h3>
                </div>
                <span className="text-[11px] font-mono text-indigo-300">Live Agent</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Need to query meeting transcripts, check DPDP compliance blockers, or update tasks
                using natural language? Launch the Copilot to run live commands.
              </p>
              <button
                type="button"
                onClick={onOpenCopilot}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Open AI Copilot Chatbot
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
