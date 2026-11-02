import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  CornerDownRight,
  GitCommitHorizontal,
  History,
} from 'lucide-react';
import { AppDatabaseState } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface CarryForwardViewProps {
  state: AppDatabaseState;
  onCarryForwardTask: (
    taskId: string,
    targetMeetingId: string,
    reason: string
  ) => Promise<void>;
}

export const CarryForwardView: React.FC<CarryForwardViewProps> = ({
  state,
  onCarryForwardTask,
}) => {
  // Default target meeting is the latest meeting (mtg-q4-ops-2)
  const defaultTargetId =
    state.meetings.find((m) => m.id === 'mtg-q4-ops-2')?.id || state.meetings[0]?.id || '';

  const [targetMeetingId, setTargetMeetingId] = useState<string>(defaultTargetId);
  const [reasonByTask, setReasonByTask] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  // Unfinished tasks from any meeting
  const unfinishedTasks = state.tasks.filter((t) => t.status !== 'completed');

  const handleCarry = async (taskId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusyTaskId(taskId);
    try {
      const customReason =
        reasonByTask[taskId]?.trim() ||
        'Unfinished action item carried forward to maintain accountability across review cycles.';
      await onCarryForwardTask(taskId, targetMeetingId, customReason);
      const task = state.tasks.find((t) => t.id === taskId);
      const targetMtg = state.meetings.find((m) => m.id === targetMeetingId);
      setSuccessMsg(
        `Carried "${task?.title}" into "${targetMtg?.title}" while preserving original source "${task?.sourceMeetingTitle}".`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not carry forward task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="carry-forward-view">
      {/* Top Explanation & Target Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Carry-Forward Accountability Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify unfinished tasks from previous meetings and carry them into subsequent sessions
            without losing their original source meeting or status history. Duplicate carry-forwards
            are automatically blocked.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <label
            htmlFor="carry-target-meeting-select"
            className="text-xs font-medium text-slate-700 whitespace-nowrap"
          >
            Target Destination Meeting:
          </label>
          <select
            id="carry-target-meeting-select"
            value={targetMeetingId}
            onChange={(e) => {
              setTargetMeetingId(e.target.value);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-900"
          >
            {state.meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.date} — {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
          data-testid="carry-forward-error"
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2"
          data-testid="carry-forward-success"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Split Layout: Unfinished Candidate Queue (7 cols) + Carry-Forward Audit Ledger (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Candidate Queue */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="px-5 py-4 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Unfinished Tasks from Meetings ({unfinishedTasks.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overdue and pending tasks eligible for carry-forward
              </p>
            </div>
          </div>

          {unfinishedTasks.map((task) => {
            const isOverdue = task.status === 'overdue';
            const alreadyInTarget =
              task.currentMeetingId === targetMeetingId ||
              state.carryForwardHistory.some(
                (cf) => cf.taskId === task.id && cf.toMeetingId === targetMeetingId
              );

            return (
              <div key={task.id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {isOverdue ? (
                        <span className="text-red-700 font-semibold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Overdue
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-600">{task.priority} Priority</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        Due {task.deadline}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
                    <p className="text-xs text-slate-500">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ParticipantAvatar
                      name={task.owner}
                      participants={state.participants}
                      size="sm"
                    />
                    <span className="text-xs font-medium text-slate-800">{task.owner}</span>
                  </div>
                </div>

                {/* Source Lineage Strip */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <GitCommitHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Original Source Meeting:</span>
                    <strong className="text-slate-900">{task.sourceMeetingTitle}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Currently Tracked In:</span>
                    <strong className="text-slate-900">{task.currentMeetingTitle}</strong>
                  </div>
                </div>

                {/* Carry Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <input
                    type="text"
                    aria-label={`Carry forward note for ${task.title}`}
                    value={reasonByTask[task.id] || ''}
                    onChange={(e) =>
                      setReasonByTask({ ...reasonByTask, [task.id]: e.target.value })
                    }
                    placeholder="Optional carry-forward reason / context note..."
                    disabled={alreadyInTarget}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-md disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    disabled={alreadyInTarget || busyTaskId === task.id}
                    onClick={() => handleCarry(task.id)}
                    data-testid={`carry-btn-${task.id}`}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      alreadyInTarget
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {alreadyInTarget ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Already in Target Meeting
                      </>
                    ) : (
                      <>
                        Carry Forward to Meeting
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carry-Forward Audit Ledger */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="px-5 py-4 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Carry-Forward Lineage Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable audit trail of tasks carried across meetings
              </p>
            </div>
            <span
              className="text-xs font-mono tabular-nums font-semibold text-blue-700"
              data-testid="carry-forward-count"
            >
              {state.carryForwardHistory.length} recorded
            </span>
          </div>

          {state.carryForwardHistory.map((cf) => (
            <div key={cf.id} className="p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-medium text-slate-900">{cf.owner}</span>
                <span className="font-mono tabular-nums">
                  {cf.carriedAt.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{cf.taskTitle}</p>
              <div className="space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500">Original Source: </span>
                  <span className="font-medium text-slate-800">{cf.originalMeetingTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500">Carried Into: </span>
                  <span className="font-medium text-blue-700">{cf.toMeetingTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500">Reason: </span>
                  <span>{cf.reason}</span>
                </div>
              </div>
            </div>
          ))}

          {state.carryForwardHistory.length === 0 && (
            <div className="p-10 text-center">
              <History className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="mt-2 text-sm font-medium text-slate-900">
                No tasks carried forward yet
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                Click <strong>Carry Forward to Meeting</strong> on any overdue or pending task on
                the left to link it to the current review session while preserving its origin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
