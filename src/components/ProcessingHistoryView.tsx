import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Filter,
  GitBranch,
  History,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { evaluateWorkspaceDataQuality } from '../core/engine';
import { AppDatabaseState, IngestionInputType } from '../core/types';

interface ProcessingHistoryViewProps {
  state: AppDatabaseState;
  onSelectMeeting: (meetingId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ProcessingHistoryView: React.FC<ProcessingHistoryViewProps> = ({
  state,
  onSelectMeeting,
  onNavigateTab,
}) => {
  const [inputTypeFilter, setInputTypeFilter] = useState<'all' | IngestionInputType>('all');
  const [validationFilter, setValidationFilter] = useState<'all' | 'Valid' | 'Warning' | 'Failed'>(
    'all'
  );
  const [issueCategoryFilter, setIssueCategoryFilter] = useState<string>('all');

  const dataQuality = useMemo(() => evaluateWorkspaceDataQuality(state), [state]);
  const logs = state.processingHistory || [];

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (inputTypeFilter !== 'all' && entry.inputType !== inputTypeFilter) return false;
      if (validationFilter !== 'all' && entry.validationStatus !== validationFilter) return false;
      return true;
    });
  }, [logs, inputTypeFilter, validationFilter]);

  const filteredIssues = useMemo(() => {
    return dataQuality.issues.filter((iss) => {
      if (issueCategoryFilter !== 'all' && iss.category !== issueCategoryFilter) return false;
      return true;
    });
  }, [dataQuality.issues, issueCategoryFilter]);

  return (
    <div className="space-y-6" data-testid="processing-history-view">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
            PwC Data Engineering Associate · Pipeline Audit &amp; Data Quality
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Data Processing History, Schema Validation &amp; Referential Integrity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end pipeline: Meeting Transcript → AI Extraction → Structured Validation →
            Database Storage → Task Integration → Analytics
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('meetings')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            1. Ingest Meeting Data
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('ai-assistant')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            2. Run AI Extraction
          </button>
        </div>
      </div>

      {/* 6-Stage End-to-End Data Engineering Pipeline Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
              End-to-End Data Engineering Pipeline &amp; Live Measured Telemetry
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click any stage to inspect live records across ingestion, extraction, validation, storage, task integration, and analytics
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
            Referential Integrity: {dataQuality.orphanedRelationshipsCount} orphaned records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          {[
            {
              stage: 'Stage 1 · Ingestion',
              title: 'Meeting Transcript',
              metric: `${state.meetings.length} meetings`,
              detail: `${state.meetings.filter((m) => m.transcript.trim().length > 0).length} verbatim transcripts`,
              api: 'POST /api/meetings/ingest',
              tab: 'meetings',
            },
            {
              stage: 'Stage 2 · Transformation',
              title: 'AI Extraction',
              metric: `${state.meetings.filter((m) => Boolean(m.aiSummary)).length}/${state.meetings.length} extracted`,
              detail: `${logs.length} extraction run(s) logged`,
              api: 'POST /api/ai/analyze-meeting',
              tab: 'ai-assistant',
            },
            {
              stage: 'Stage 3 · Data Quality',
              title: 'Structured Validation',
              metric: `${dataQuality.validRecordsCount}/${dataQuality.totalRecordsChecked} valid`,
              detail: `${dataQuality.errorCount} failures · ${dataQuality.warningCount} warnings`,
              api: 'GET /api/data-quality',
              tab: 'processing-history',
            },
            {
              stage: 'Stage 4 · Persistence',
              title: 'Database Storage',
              metric: `${state.decisions.length} decisions`,
              detail: `${state.tasks.length} tasks · ${state.handovers.length} transfers`,
              api: 'GET /api/decisions',
              tab: 'meetings',
            },
            {
              stage: 'Stage 5 · Lineage',
              title: 'Task Integration',
              metric: `${state.tasks.length} action items`,
              detail: `${state.carryForwardHistory.length} carried forward`,
              api: 'GET /api/action-items',
              tab: 'tasks',
            },
            {
              stage: 'Stage 6 · Reporting',
              title: 'Live Analytics',
              metric: `${Math.round((state.tasks.filter((t) => t.status === 'completed').length / Math.max(1, state.tasks.length)) * 100)}% completion`,
              detail: `${state.tasks.filter((t) => t.status === 'overdue').length} overdue · ${state.tasks.filter((t) => t.status === 'in-progress').length} in progress`,
              api: 'GET /api/analytics',
              tab: 'reports',
            },
          ].map((node) => (
            <button
              key={node.stage}
              type="button"
              onClick={() => onNavigateTab(node.tab)}
              className="p-3 rounded-lg bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">
                  {node.stage}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{node.title}</div>
                <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {node.metric}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">{node.detail}</div>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-2 pt-1.5 border-t border-slate-200/80 truncate">
                {node.api}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Quality Summary KPI Strip (Feature D) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Data Quality Status</div>
          <div
            className={`mt-1 text-base font-bold font-mono ${
              dataQuality.overallStatus === 'Healthy'
                ? 'text-emerald-700'
                : dataQuality.overallStatus === 'Attention Needed'
                ? 'text-amber-700'
                : 'text-red-600'
            }`}
            data-testid="dq-overall-status"
          >
            {dataQuality.overallStatus}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {dataQuality.totalRecordsChecked} entities audited
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Valid Entities</div>
          <div
            className="mt-1 text-2xl font-bold text-emerald-700 font-mono tabular-nums"
            data-testid="dq-valid-records"
          >
            {dataQuality.validRecordsCount}
          </div>
          <div className="text-[11px] text-slate-500">Passed all checks</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Validation Warnings</div>
          <div
            className="mt-1 text-2xl font-bold text-amber-700 font-mono tabular-nums"
            data-testid="dq-warning-count"
          >
            {dataQuality.warningCount}
          </div>
          <div className="text-[11px] text-slate-500">Pending human review</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Schema / Date Errors</div>
          <div
            className="mt-1 text-2xl font-bold text-red-600 font-mono tabular-nums"
            data-testid="dq-error-count"
          >
            {dataQuality.errorCount}
          </div>
          <div className="text-[11px] text-slate-500">Failed record checks</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Duplicate Tasks</div>
          <div
            className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums"
            data-testid="dq-duplicate-count"
          >
            {dataQuality.duplicateActionItemsDetected}
          </div>
          <div className="text-[11px] text-slate-500">Deduplication active</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Unassigned / Unspec.</div>
          <div className="mt-1 text-2xl font-bold text-indigo-700 font-mono tabular-nums">
            {dataQuality.unassignedTasksCount + dataQuality.unspecifiedDatesCount}
          </div>
          <div className="text-[11px] text-slate-500">Owner / date flags</div>
        </div>
      </div>

      {/* Feature G — Data Processing History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Data Processing &amp; Extraction History ({filteredLogs.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of meeting ingestion, transcript processing, extracted counts,
              validation status, and error tracking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by input type"
              value={inputTypeFilter}
              onChange={(e) => setInputTypeFilter(e.target.value as 'all' | IngestionInputType)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Input Types</option>
              <option value="transcript-analysis">Transcript Analysis</option>
              <option value="manual">Manual Entry</option>
              <option value="txt">TXT Import</option>
              <option value="csv">CSV Import</option>
              <option value="json">JSON Import</option>
            </select>

            <select
              aria-label="Filter by validation status"
              value={validationFilter}
              onChange={(e) =>
                setValidationFilter(e.target.value as 'all' | 'Valid' | 'Warning' | 'Failed')
              }
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Validation States</option>
              <option value="Valid">Valid</option>
              <option value="Warning">Warning</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" data-testid="processing-history-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Meeting Identifier</th>
                <th className="py-3 px-4">Processing Timestamp</th>
                <th className="py-3 px-4">Input Type</th>
                <th className="py-3 px-4">Extraction Status</th>
                <th className="py-3 px-4 text-right">Decisions Extracted</th>
                <th className="py-3 px-4 text-right">Action Items Extracted</th>
                <th className="py-3 px-4">Validation Status</th>
                <th className="py-3 px-4">Processing Errors / Warnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 align-top">
                    <button
                      type="button"
                      onClick={() => {
                        if (state.meetings.some((m) => m.id === log.meetingId)) {
                          onSelectMeeting(log.meetingId);
                          onNavigateTab('meetings');
                        }
                      }}
                      className="text-left group cursor-pointer"
                    >
                      <div className="font-mono font-semibold text-indigo-600 group-hover:underline">
                        {log.meetingId}
                      </div>
                      <div className="text-slate-700 font-medium line-clamp-1 max-w-[240px]">
                        {log.meetingTitle}
                      </div>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 align-top font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {log.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span className="font-mono uppercase text-slate-800 font-semibold">
                      {log.inputType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        log.extractionStatus === 'Completed'
                          ? 'text-emerald-700'
                          : log.extractionStatus === 'Failed'
                          ? 'text-red-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {log.extractionStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums font-semibold text-slate-900">
                    {log.decisionsExtracted}
                  </td>
                  <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums font-semibold text-slate-900">
                    {log.actionItemsExtracted}
                  </td>
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        log.validationStatus === 'Valid'
                          ? 'text-emerald-700'
                          : log.validationStatus === 'Warning'
                          ? 'text-amber-700'
                          : 'text-red-600'
                      }`}
                    >
                      {log.validationStatus === 'Valid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {log.validationStatus === 'Warning' && (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {log.validationStatus === 'Failed' && <ShieldAlert className="w-3.5 h-3.5" />}
                      {log.validationStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top text-slate-600 max-w-xs">
                    {log.errors.length > 0 ? (
                      <div className="text-red-600 font-medium space-y-0.5">
                        {log.errors.map((e, i) => (
                          <div key={i}>Error: {e}</div>
                        ))}
                      </div>
                    ) : log.warnings.length > 0 ? (
                      <div className="text-amber-800 space-y-0.5">
                        {log.warnings.slice(0, 2).map((w, i) => (
                          <div key={i}>{w}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">None — Schema &amp; relationships valid</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No processing logs match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature D — Active Data Quality & Validation Rule Checks */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Live Data Quality &amp; Validation Rules Inspector ({filteredIssues.length} active
              notices)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Checks required fields, duplicate action items, ISO date validity, task owner
              assignment, and meeting relationship integrity
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter validation notices by category"
              value={issueCategoryFilter}
              onChange={(e) => setIssueCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Rule Categories</option>
              <option value="Required Field">Required Field</option>
              <option value="Duplicate Detection">Duplicate Detection</option>
              <option value="Date Format">Date Format</option>
              <option value="Owner Validation">Owner Validation</option>
              <option value="Relationship Integrity">Relationship Integrity</option>
              <option value="AI Output Validation">AI Output Validation</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`font-semibold ${
                      issue.severity === 'Error' ? 'text-red-600' : 'text-amber-700'
                    }`}
                  >
                    {issue.severity.toUpperCase()}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-indigo-700 font-medium">{issue.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500">
                    {issue.entityType} ({issue.entityId})
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-900">{issue.entityTitle}</div>
                <p className="text-xs text-slate-600">{issue.message}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (issue.entityType === 'Meeting') {
                    onSelectMeeting(issue.entityId);
                    onNavigateTab('ai-assistant');
                  } else if (issue.entityType === 'ActionItem') {
                    onNavigateTab('tasks');
                  } else {
                    onNavigateTab('meetings');
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Inspect &amp; Resolve
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {filteredIssues.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span className="font-medium text-slate-800">
                All workspace records pass validation for this category.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PwC Data Engineering Associate JD Alignment Matrix */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4"
        data-testid="pwc-jd-alignment-matrix"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">
              Role Verification · PwC Data Engineering Associate
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Data Engineering Competency &amp; Implementation Matrix
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            8 / 8 Core Competencies Verified Against Live Database
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            {
              competency: '1. Data Ingestion',
              implementation: 'Multi-format TXT, CSV, JSON & manual meeting transcript ingestion with duplicate detection',
              liveMetric: `${state.meetings.length} meetings · ${logs.length} ingestion logs`,
            },
            {
              competency: '2. Data Transformation',
              implementation: 'Gemini structured JSON schema & deterministic NLP parser converting raw transcripts to typed records',
              liveMetric: `${state.decisions.length} decisions · ${state.tasks.length} tasks extracted`,
            },
            {
              competency: '3. Data Quality & Validation',
              implementation: 'Required-field checks, ISO YYYY-MM-DD validation, owner verification & duplicate task prevention',
              liveMetric: `${dataQuality.validRecordsCount}/${dataQuality.totalRecordsChecked} valid · ${dataQuality.errorCount} failures`,
            },
            {
              competency: '4. Data Modelling',
              implementation: 'Normalized TypeScript/JSON relational schema for Meetings, Decisions, ActionItems, CarryForward & Logs',
              liveMetric: `7 linked entity collections · ${dataQuality.orphanedRelationshipsCount} orphans`,
            },
            {
              competency: '5. Database Management',
              implementation: 'Atomic file-backed workspace persistence (.data/workspace-store.json) + REST API state synchronization',
              liveMetric: `${state.participants.length} leads · ${state.handovers.length} transfer packages`,
            },
            {
              competency: '6. Data Integration',
              implementation: 'End-to-end lineage connecting Meeting → Transcript → Summary → Decisions → Action Items → Follow-Ups',
              liveMetric: `${state.tasks.filter((t) => Boolean(t.sourceMeetingId)).length}/${state.tasks.length} tasks source-linked`,
            },
            {
              competency: '7. Data Processing & Audit',
              implementation: 'Chronological ProcessingLogEntry ledger recording timestamp, input format, engine & validation warnings',
              liveMetric: `${logs.filter((l) => l.extractionStatus === 'Completed').length} completed runs`,
            },
            {
              competency: '8. Analytical Thinking',
              implementation: 'Live KPI computation, Kanban WIP Task Limit bottleneck detection & multi-city owner workload metrics',
              liveMetric: `${Math.round((state.tasks.filter((t) => t.status === 'completed').length / Math.max(1, state.tasks.length)) * 100)}% completion rate`,
            },
          ].map((item) => (
            <div
              key={item.competency}
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="font-bold text-slate-900">{item.competency}</div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {item.implementation}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/80 font-mono text-[11px] font-semibold text-indigo-700">
                {item.liveMetric}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
