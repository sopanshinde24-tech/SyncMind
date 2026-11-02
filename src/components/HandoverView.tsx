import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Plus,
  X,
} from 'lucide-react';
import { AppDatabaseState } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface HandoverViewProps {
  state: AppDatabaseState;
  onCreateHandover: (payload: {
    title: string;
    projectContext: string;
    fromPerson: string;
    toPerson: string;
    completedWork: string[];
    pendingTasks: string[];
    blockers: string[];
    decisions: string[];
    nextSteps: string[];
  }) => Promise<void>;
  onAcknowledgeHandover: (handoverId: string, note: string) => Promise<void>;
}

export const HandoverView: React.FC<HandoverViewProps> = ({
  state,
  onCreateHandover,
  onAcknowledgeHandover,
}) => {
  const [ackNotes, setAckNotes] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [fromPerson, setFromPerson] = useState('Marcus Vance');
  const [toPerson, setToPerson] = useState('Elena Rostova');
  const [completedText, setCompletedText] = useState('');
  const [pendingText, setPendingText] = useState('');
  const [blockersText, setBlockersText] = useState('');
  const [decisionsText, setDecisionsText] = useState('');
  const [nextStepsText, setNextStepsText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openModalWithAutoPopulate = () => {
    setTitle('Platform Engineering Q4 Sprint & Webhook Migration Handover');
    setProjectContext(
      'Knowledge transfer covering EU-Central read-replica benchmarks, Stripe dead-letter worker migration status, and November schema freeze protocols.'
    );
    setFromPerson('Marcus Vance');
    setToPerson('Elena Rostova');
    setCompletedText(
      state.tasks
        .filter((t) => t.status === 'completed')
        .map((t) => `${t.title} (${t.owner})`)
        .join('\n')
    );
    setPendingText(
      state.tasks
        .filter((t) => t.status !== 'completed')
        .map((t) => `${t.title} (${t.owner} — ${t.status.toUpperCase()})`)
        .join('\n')
    );
    setBlockersText(state.blockers.map((b) => b.description).join('\n'));
    setDecisionsText(state.decisions.map((d) => d.summary).join('\n'));
    setNextStepsText(
      'Verify Stripe dead-letter retry queue in staging\nConfirm DACH banking IP whitelist rules'
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !projectContext.trim()) {
      setFormError('Handover title and project context are required.');
      return;
    }

    const splitLines = (txt: string) =>
      txt
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

    try {
      await onCreateHandover({
        title,
        projectContext,
        fromPerson,
        toPerson,
        completedWork: splitLines(completedText),
        pendingTasks: splitLines(pendingText),
        blockers: splitLines(blockersText),
        decisions: splitLines(decisionsText),
        nextSteps: splitLines(nextStepsText),
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create handover.');
    }
  };

  return (
    <div className="space-y-6" data-testid="handover-view">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Structured Knowledge &amp; Work Handovers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Package project context, completed milestones, pending tasks, blockers, decisions, and
            next steps so incoming team members have complete historical clarity.
          </p>
        </div>

        <button
          type="button"
          onClick={openModalWithAutoPopulate}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Knowledge Handover
        </button>
      </div>

      {/* Handover Records */}
      <div className="space-y-6">
        {state.handovers.map((hnd) => {
          const isAck = hnd.status === 'Acknowledged';
          return (
            <div
              key={hnd.id}
              className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200"
            >
              {/* Top Metadata Header */}
              <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span
                      className={
                        isAck
                          ? 'text-emerald-700 font-semibold'
                          : 'text-amber-700 font-semibold'
                      }
                    >
                      {hnd.status}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Created {hnd.createdAt.slice(0, 10)}
                    </span>
                    {hnd.acknowledgedAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-emerald-700">
                          Acknowledged {hnd.acknowledgedAt.slice(0, 16).replace('T', ' ')}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{hnd.title}</h3>
                </div>

                {/* From -> To Participant Strip */}
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 shrink-0">
                  <div className="flex items-center gap-2 text-xs">
                    <ParticipantAvatar
                      name={hnd.fromPerson}
                      participants={state.participants}
                      size="sm"
                    />
                    <div>
                      <span className="block text-[10px] text-slate-400">From</span>
                      <span className="font-semibold text-slate-900">{hnd.fromPerson}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="flex items-center gap-2 text-xs">
                    <ParticipantAvatar
                      name={hnd.toPerson}
                      participants={state.participants}
                      size="sm"
                    />
                    <div>
                      <span className="block text-[10px] text-slate-400">To Recipient</span>
                      <span className="font-semibold text-slate-900">{hnd.toPerson}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Context */}
              <div className="p-6 bg-slate-50/50">
                <h4 className="text-xs font-semibold text-slate-700">Project &amp; Operational Context</h4>
                <p className="mt-1.5 text-sm text-slate-800 leading-relaxed">
                  {hnd.projectContext}
                </p>
              </div>

              {/* 4-Grid Structured Breakdown */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Completed Work ({hnd.completedWork.length})
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside bg-slate-50 p-3.5 rounded border border-slate-200">
                    {hnd.completedWork.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
                    Pending &amp; Overdue Tasks ({hnd.pendingTasks.length})
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside bg-slate-50 p-3.5 rounded border border-slate-200">
                    {hnd.pendingTasks.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Active Blockers ({hnd.blockers.length})
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside bg-red-50/40 p-3.5 rounded border border-red-200">
                    {hnd.blockers.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                    Key Decisions &amp; Next Steps
                  </h4>
                  <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2 text-xs text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-900">Decisions:</span>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        {hnd.decisions.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-900">Immediate Next Steps:</span>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        {hnd.nextSteps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Acknowledgment Footer */}
              <div className="p-5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {isAck ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Acknowledged by {hnd.toPerson}:</strong> {hnd.acknowledgmentNote}
                    </span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      aria-label={`Acknowledgment note for ${hnd.title}`}
                      value={ackNotes[hnd.id] || ''}
                      onChange={(e) => setAckNotes({ ...ackNotes, [hnd.id]: e.target.value })}
                      placeholder={`Add optional note as ${hnd.toPerson} before acknowledging...`}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onAcknowledgeHandover(
                          hnd.id,
                          ackNotes[hnd.id] ||
                            `Reviewed and accepted operational ownership (${hnd.toPerson}).`
                        )
                      }
                      data-testid={`ack-handover-${hnd.id}`}
                      className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Acknowledge Handover as {hnd.toPerson}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Handover Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="handover-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 id="handover-modal-title" className="text-base font-semibold text-slate-900">
                Create Knowledge &amp; Work Handover Package
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close handover modal"
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Handover Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    From (Outgoing Owner)
                  </label>
                  <input
                    type="text"
                    value={fromPerson}
                    onChange={(e) => setFromPerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    To (Receiving Owner)
                  </label>
                  <input
                    type="text"
                    value={toPerson}
                    onChange={(e) => setToPerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Context
                </label>
                <textarea
                  rows={2}
                  value={projectContext}
                  onChange={(e) => setProjectContext(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Completed Work (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={completedText}
                    onChange={(e) => setCompletedText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pending Tasks (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={pendingText}
                    onChange={(e) => setPendingText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Active Blockers (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={blockersText}
                    onChange={(e) => setBlockersText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Next Steps (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={nextStepsText}
                    onChange={(e) => setNextStepsText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Publish Handover Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
