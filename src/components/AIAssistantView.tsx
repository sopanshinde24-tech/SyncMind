import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CornerDownRight,
  FileCheck2,
  History,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  AIAnalysisResult,
  AIExtractedTaskDraft,
  AppDatabaseState,
  TaskPriority,
} from '../core/types';

interface AIAssistantViewProps {
  state: AppDatabaseState;
  initialMeetingId?: string | null;
  externalDraftAnalysis?: AIAnalysisResult | null;
  onRunAnalysis: (payload: {
    title: string;
    transcript: string;
    notes: string;
  }) => Promise<AIAnalysisResult>;
  onApproveAndSave: (meetingId: string, analysis: AIAnalysisResult) => Promise<void>;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  state,
  initialMeetingId,
  externalDraftAnalysis,
  onRunAnalysis,
  onApproveAndSave,
}) => {
  const defaultMeeting =
    state.meetings.find((m) => m.id === initialMeetingId) ||
    state.meetings.find((m) => m.id === 'mtg-q4-ops-2') ||
    state.meetings[0];

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(defaultMeeting?.id || '');
  const [transcript, setTranscript] = useState<string>(defaultMeeting?.transcript || '');
  const [notes, setNotes] = useState<string>(defaultMeeting?.notes || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [draft, setDraft] = useState<AIAnalysisResult | null>(externalDraftAnalysis || null);

  useEffect(() => {
    if (initialMeetingId) {
      const found = state.meetings.find((m) => m.id === initialMeetingId);
      if (found) {
        setSelectedMeetingId(found.id);
        setTranscript(found.transcript);
        setNotes(found.notes);
      }
    }
  }, [initialMeetingId, state.meetings]);

  useEffect(() => {
    if (externalDraftAnalysis) {
      setDraft(externalDraftAnalysis);
    }
  }, [externalDraftAnalysis]);

  const handleMeetingSwitch = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setSavedBanner(null);
    setError(null);
    const found = state.meetings.find((m) => m.id === meetingId);
    if (found) {
      setTranscript(found.transcript);
      setNotes(found.notes);
    }
  };

  const handleExtract = async () => {
    setError(null);
    setSavedBanner(null);
    if (transcript.trim().length < 10 && notes.trim().length < 10) {
      setError('Please provide a meeting transcript or notes (at least 10 characters) to analyze.');
      return;
    }

    setAnalyzing(true);
    try {
      const targetMeeting = state.meetings.find((m) => m.id === selectedMeetingId);
      const res = await onRunAnalysis({
        title: targetMeeting?.title || 'Meeting Analysis',
        transcript,
        notes,
      });
      setDraft(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI extraction failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateTaskDraft = (
    idx: number,
    field: keyof AIExtractedTaskDraft,
    value: string
  ) => {
    if (!draft) return;
    const updated = draft.actionItems.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setDraft({ ...draft, actionItems: updated });
  };

  const handleRemoveTaskDraft = (idx: number) => {
    if (!draft) return;
    setDraft({
      ...draft,
      actionItems: draft.actionItems.filter((_, i) => i !== idx),
    });
  };

  const handleAddBlankTaskDraft = () => {
    if (!draft) return;
    setDraft({
      ...draft,
      actionItems: [
        ...draft.actionItems,
        {
          title: 'Follow-up operational action item',
          description: 'Added during human review',
          owner: 'Unassigned',
          priority: 'Medium',
          deadline: 'Unspecified',
        },
      ],
    });
  };

  const handleApprove = async () => {
    if (!draft || !selectedMeetingId) return;
    setSaving(true);
    setError(null);
    try {
      await onApproveAndSave(selectedMeetingId, draft);
      const mtg = state.meetings.find((m) => m.id === selectedMeetingId);
      setSavedBanner(
        `Approved and saved ${draft.actionItems.length} action items, ${draft.decisions.length} decisions, and ${draft.blockers.length} blockers to "${mtg?.title}".`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save approved items.');
    } finally {
      setSaving(false);
    }
  };

  const activeTargetMeeting = state.meetings.find((m) => m.id === selectedMeetingId);
  const previousMeetingsContext = state.tasks.filter(
    (t) => t.sourceMeetingId !== selectedMeetingId && t.status !== 'completed'
  );

  return (
    <div className="space-y-6" data-testid="ai-assistant-view">
      {/* Top Info Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-violet-600 font-semibold">
            AI Meeting Intelligence · Human-in-the-Loop Governance
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Structured Transcript Extraction &amp; Verification
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Extract summaries, key insights, decisions, tasks, and follow-ups. Missing owners or
            dates are strictly flagged as{' '}
            <span className="font-mono text-amber-800 font-semibold">Unassigned</span> or{' '}
            <span className="font-mono text-amber-800 font-semibold">Unspecified</span> until
            human-confirmed.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExtract}
            disabled={analyzing}
            data-testid="run-ai-analysis-btn"
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Transcript...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run AI Meeting Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {savedBanner && (
        <div
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2"
          data-testid="ai-approval-success"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{savedBanner}</span>
        </div>
      )}

      {/* Split Workspace: Left Source Transcript & Previous Context (5 cols) + Right Human Review & Approval (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Source Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <label
                htmlFor="select-source-meeting"
                className="block text-xs font-semibold text-slate-700"
              >
                Target Meeting Record
              </label>
              {activeTargetMeeting?.aiSummary ? (
                <span className="text-[11px] font-mono text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Human-Verified Summary Stored
                </span>
              ) : (
                <span className="text-[11px] font-mono text-amber-700">Awaiting AI Analysis</span>
              )}
            </div>
            <select
              id="select-source-meeting"
              value={selectedMeetingId}
              onChange={(e) => handleMeetingSwitch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {state.meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.date} — {m.title}
                </option>
              ))}
            </select>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="ai-transcript-textarea"
                  className="text-xs font-semibold text-slate-700"
                >
                  Meeting Transcript
                </label>
                <span className="text-[11px] text-slate-500">
                  Source of truth for AI extraction
                </span>
              </div>
              <textarea
                id="ai-transcript-textarea"
                rows={12}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste meeting transcript here..."
                className="w-full p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 leading-relaxed"
              />
            </div>

            <div>
              <label
                htmlFor="ai-notes-textarea"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Supplementary Context / Notes
              </label>
              <textarea
                id="ai-notes-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Context from Previous Meetings */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                Context from Previous Meetings
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {previousMeetingsContext.length} open item(s)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Unfinished action items from prior sessions that may require follow-up or
              carry-forward continuity:
            </p>
            <div className="space-y-2">
              {previousMeetingsContext.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold ${
                        item.status === 'overdue' ? 'text-red-600' : 'text-amber-700'
                      }`}
                    >
                      {item.status.toUpperCase()} · {item.owner}
                    </span>
                    <span className="font-mono text-slate-500">Due {item.deadline}</span>
                  </div>
                  <div className="text-slate-900 font-medium">{item.title}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3 text-indigo-600" />
                    Origin: {item.sourceMeetingTitle}
                  </div>
                </div>
              ))}
              {previousMeetingsContext.length === 0 && (
                <div className="text-xs text-slate-500 italic">
                  All tasks from prior meetings are completed.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Structured AI Output & Human Review Controls */}
        <div className="lg:col-span-7">
          {draft ? (
            <div
              className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 shadow-2xs overflow-hidden"
              data-testid="ai-review-panel"
            >
              {/* Review Header */}
              <div className="p-5 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-mono font-semibold text-[11px]">
                      AI-GENERATED DRAFT
                    </span>
                    <span className="font-semibold text-slate-900 inline-flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Human Review &amp; Approval Required
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className="text-slate-600 font-mono text-[11px]">
                      {draft.sourceEngine === 'gemini'
                        ? 'Gemini 2.5 Flash Structured JSON'
                        : 'Source-Grounded Deterministic Extractor'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Inspect and edit AI-generated fields below before committing human-confirmed
                    records to the database.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={saving}
                  data-testid="approve-save-analysis-btn"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Saving Confirmed Output...' : 'Approve & Save to Meeting'}
                </button>
              </div>

              {/* 1. Editable Summary */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="review-summary-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    1. Meeting Summary &amp; Key Insights
                  </label>
                  <span className="text-[11px] font-mono text-violet-600">Editable Draft</span>
                </div>
                <textarea
                  id="review-summary-input"
                  rows={3}
                  value={draft.summary}
                  onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                  className="w-full p-3 text-sm text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 leading-relaxed"
                />
              </div>

              {/* 2. Extracted Decisions */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-700">
                    2. Extracted Decisions ({draft.decisions.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Strictly extracted from transcript commitments
                  </span>
                </div>
                <div className="space-y-3">
                  {draft.decisions.map((dec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-medium">Decision #{idx + 1}</span>
                        <span aria-hidden="true">·</span>
                        <span>Owner:</span>
                        <input
                          type="text"
                          aria-label={`Decision ${idx + 1} owner`}
                          value={dec.owner}
                          onChange={(e) => {
                            const updated = draft.decisions.map((d, i) =>
                              i === idx ? { ...d, owner: e.target.value } : d
                            );
                            setDraft({ ...draft, decisions: updated });
                          }}
                          className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <input
                        type="text"
                        aria-label={`Decision ${idx + 1} summary`}
                        value={dec.summary}
                        onChange={(e) => {
                          const updated = draft.decisions.map((d, i) =>
                            i === idx ? { ...d, summary: e.target.value } : d
                          );
                          setDraft({ ...draft, decisions: updated });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Extracted Action Items (Editable Owners, Priorities, Deadlines) */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700">
                      3. Extracted Tasks &amp; Action Items ({draft.actionItems.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Items without an explicit source owner or date are flagged as{' '}
                      <span className="font-mono text-amber-800">Unassigned</span> /{' '}
                      <span className="font-mono text-amber-800">Unspecified</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBlankTaskDraft}
                    className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {draft.actionItems.map((item, idx) => {
                    const isUnassigned = item.owner === 'Unassigned';
                    const isUnspecifiedDate = item.deadline === 'Unspecified';
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <input
                            type="text"
                            aria-label={`Action item ${idx + 1} title`}
                            value={item.title}
                            onChange={(e) => handleUpdateTaskDraft(idx, 'title', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTaskDraft(idx)}
                            aria-label={`Remove action item ${idx + 1}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">
                              Owner {isUnassigned && '(Not in source)'}
                            </label>
                            <input
                              type="text"
                              aria-label={`Action item ${idx + 1} owner`}
                              value={item.owner}
                              onChange={(e) => handleUpdateTaskDraft(idx, 'owner', e.target.value)}
                              className={`w-full px-2.5 py-1 text-xs bg-white border rounded ${
                                isUnassigned
                                  ? 'border-amber-400 text-amber-800 font-medium'
                                  : 'border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">
                              Deadline {isUnspecifiedDate && '(Not in source)'}
                            </label>
                            <input
                              type="text"
                              aria-label={`Action item ${idx + 1} deadline`}
                              value={item.deadline}
                              onChange={(e) =>
                                handleUpdateTaskDraft(idx, 'deadline', e.target.value)
                              }
                              className={`w-full px-2.5 py-1 text-xs font-mono bg-white border rounded ${
                                isUnspecifiedDate
                                  ? 'border-amber-400 text-amber-800 font-medium'
                                  : 'border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">
                              Priority
                            </label>
                            <select
                              aria-label={`Action item ${idx + 1} priority`}
                              value={item.priority}
                              onChange={(e) =>
                                handleUpdateTaskDraft(
                                  idx,
                                  'priority',
                                  e.target.value as TaskPriority
                                )
                              }
                              className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded text-slate-900"
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Blockers & Suggested Follow-ups */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-2">
                    4. Operational Blockers ({draft.blockers.length})
                  </h3>
                  {draft.blockers.length > 0 ? (
                    <div className="space-y-2">
                      {draft.blockers.map((blk, i) => (
                        <div
                          key={i}
                          className="p-3 bg-red-50/50 border border-red-200 rounded-lg text-xs text-slate-800"
                        >
                          <div className="flex items-center gap-1.5 text-red-700 font-medium mb-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{blk.severity} Severity</span>
                            <span aria-hidden="true">·</span>
                            <span>Owner: {blk.owner}</span>
                          </div>
                          <p>{blk.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No blockers identified in source.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-2">
                    5. Suggested Follow-Ups &amp; Next Steps
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {draft.nextSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Ready to Extract Structured Meeting Intelligence
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Select a meeting on the left or paste any meeting transcript, then click{' '}
                <strong>Run AI Meeting Analysis</strong> to generate a source-grounded summary,
                decisions, action items, owners, deadlines, and suggested follow-ups for human
                review.
              </p>
              <button
                type="button"
                onClick={handleExtract}
                disabled={analyzing}
                className="mt-5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Run AI Meeting Analysis Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
