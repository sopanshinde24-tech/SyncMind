import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckSquare,
  FileCheck2,
  Repeat,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { AppDatabaseState } from '../core/types';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppDatabaseState;
  onSelectMeeting: (meetingId: string) => void;
  onSelectTask: (taskId: string) => void;
  onNavigateTab: (
    tab:
      | 'dashboard'
      | 'meetings'
      | 'ai-assistant'
      | 'tasks'
      | 'carry-forward'
      | 'handover'
      | 'reports'
      | 'settings'
  ) => void;
  onOpenCopilot: () => void;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({
  isOpen,
  onClose,
  state,
  onSelectMeeting,
  onSelectTask,
  onNavigateTab,
  onOpenCopilot,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const normalizedQuery = query.trim().toLowerCase();

  const matchingMeetings = useMemo(() => {
    return state.meetings.filter(
      (m) =>
        !normalizedQuery ||
        m.title.toLowerCase().includes(normalizedQuery) ||
        m.transcript.toLowerCase().includes(normalizedQuery) ||
        m.participants.some((p) => p.toLowerCase().includes(normalizedQuery))
    );
  }, [state.meetings, normalizedQuery]);

  const matchingTasks = useMemo(() => {
    return state.tasks.filter(
      (t) =>
        !normalizedQuery ||
        t.title.toLowerCase().includes(normalizedQuery) ||
        t.description.toLowerCase().includes(normalizedQuery) ||
        t.owner.toLowerCase().includes(normalizedQuery) ||
        t.status.toLowerCase().includes(normalizedQuery)
    );
  }, [state.tasks, normalizedQuery]);

  const matchingDecisionsAndBlockers = useMemo(() => {
    const decisions = state.decisions
      .filter(
        (d) =>
          !normalizedQuery ||
          d.summary.toLowerCase().includes(normalizedQuery) ||
          d.owner.toLowerCase().includes(normalizedQuery)
      )
      .map((d) => ({
        id: d.id,
        kind: 'Decision' as const,
        text: d.summary,
        owner: d.owner,
        meetingId: d.meetingId,
      }));

    const blockers = state.blockers
      .filter(
        (b) =>
          !normalizedQuery ||
          b.description.toLowerCase().includes(normalizedQuery) ||
          b.owner.toLowerCase().includes(normalizedQuery)
      )
      .map((b) => ({
        id: b.id,
        kind: 'Blocker' as const,
        text: b.description,
        owner: b.owner,
        meetingId: b.meetingId,
      }));

    return [...decisions, ...blockers];
  }, [state.decisions, state.blockers, normalizedQuery]);

  const matchingTransfers = useMemo(() => {
    return state.handovers.filter(
      (h) =>
        !normalizedQuery ||
        h.title.toLowerCase().includes(normalizedQuery) ||
        h.fromPerson.toLowerCase().includes(normalizedQuery) ||
        h.toPerson.toLowerCase().includes(normalizedQuery) ||
        h.projectContext.toLowerCase().includes(normalizedQuery)
    );
  }, [state.handovers, normalizedQuery]);

  if (!isOpen) return null;

  const totalResults =
    matchingMeetings.length +
    matchingTasks.length +
    matchingDecisionsAndBlockers.length +
    matchingTransfers.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-16 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Workspace Command Search"
      data-testid="command-search-modal"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Bar */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings, transcripts, tasks, owners (Ananya, Rohan, Priya), decisions, or transfers..."
            data-testid="command-search-input"
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results Body */}
        <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-100">
          {totalResults === 0 ? (
            <div className="py-12 px-6 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700">
                No workspace records match &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-500">
                Try searching for a participant (Ananya, Rohan, Priya), RAG, DPDP, or ask the AI
                Copilot directly.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCopilot();
                }}
                className="mt-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask AI Copilot Instead
              </button>
            </div>
          ) : (
            <>
              {/* Quick Navigation Shortcuts when query is empty */}
              {!normalizedQuery && (
                <div className="p-3 bg-slate-50/70">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Quick Workspace Actions
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('ai-assistant');
                        onClose();
                      }}
                      className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-left text-xs font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span className="truncate">AI Intelligence</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('tasks');
                        onClose();
                      }}
                      className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-left text-xs font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">Action Items</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('handover');
                        onClose();
                      }}
                      className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-left text-xs font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Work Transfers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab('carry-forward');
                        onClose();
                      }}
                      className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-left text-xs font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Repeat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Carry-Forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Matching Meetings */}
              {matchingMeetings.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Meetings ({matchingMeetings.length})
                  </div>
                  <div className="space-y-1">
                    {matchingMeetings.map((mtg) => (
                      <button
                        key={mtg.id}
                        type="button"
                        onClick={() => {
                          onSelectMeeting(mtg.id);
                          onClose();
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                              {mtg.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {mtg.date} · {mtg.startTime} · {mtg.participants.join(', ')}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Action Items */}
              {matchingTasks.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Action Items ({matchingTasks.length})
                  </div>
                  <div className="space-y-1">
                    {matchingTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          onSelectTask(task.id);
                          onClose();
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                task.status === 'completed'
                                  ? 'bg-emerald-500'
                                  : task.status === 'overdue'
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                              {task.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono pl-4">
                            Owner: {task.owner} · Due: {task.deadline} · {task.status.toUpperCase()}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Decisions & Blockers */}
              {matchingDecisionsAndBlockers.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Decisions &amp; Blockers ({matchingDecisionsAndBlockers.length})
                  </div>
                  <div className="space-y-1">
                    {matchingDecisionsAndBlockers.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectMeeting(item.meetingId);
                          onClose();
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {item.kind === 'Blocker' ? (
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          ) : (
                            <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-900 line-clamp-1 group-hover:text-indigo-600">
                              {item.text}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {item.kind} · Owner: {item.owner}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Work Transfers */}
              {matchingTransfers.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Work Transfers ({matchingTransfers.length})
                  </div>
                  <div className="space-y-1">
                    {matchingTransfers.map((tr) => (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => {
                          onNavigateTab('handover');
                          onClose();
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                            {tr.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {tr.fromPerson} &rarr; {tr.toPerson} · {tr.status}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono">ESC</kbd> to close
          </span>
          <span className="font-mono">{totalResults} matching workspace records</span>
        </div>
      </div>
    </div>
  );
};
