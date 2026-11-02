import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CornerDownRight,
  Edit3,
  History,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ActionItem, AppDatabaseState, TaskPriority, TaskStatus } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface TasksViewProps {
  state: AppDatabaseState;
  onCreateTask: (payload: {
    title: string;
    description: string;
    owner: string;
    priority: TaskPriority;
    deadline: string;
    sourceMeetingId: string;
  }) => Promise<void>;
  onUpdateTask: (
    taskId: string,
    updates: Partial<
      Pick<ActionItem, 'title' | 'description' | 'owner' | 'priority' | 'deadline' | 'status'>
    >
  ) => Promise<void>;
  onToggleTaskStatus: (taskId: string, nextStatus: 'pending' | 'completed') => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const TasksView: React.FC<TasksViewProps> = ({
  state,
  onCreateTask,
  onUpdateTask,
  onToggleTaskStatus,
  onDeleteTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'status'>('deadline');

  // Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ActionItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('Elena Rostova');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [deadline, setDeadline] = useState('2026-11-06');
  const [sourceMeetingId, setSourceMeetingId] = useState(state.meetings[0]?.id || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [historyTask, setHistoryTask] = useState<ActionItem | null>(null);

  const ownersList = useMemo(() => {
    const set = new Set<string>(state.participants.map((p) => p.name));
    state.tasks.forEach((t) => set.add(t.owner));
    return Array.from(set);
  }, [state.participants, state.tasks]);

  const filteredTasks = useMemo(() => {
    const priorityRank: Record<TaskPriority, number> = { High: 1, Medium: 2, Low: 3 };
    const statusRank: Record<TaskStatus, number> = { overdue: 1, pending: 2, completed: 3 };

    return state.tasks
      .filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (ownerFilter !== 'all' && t.owner !== ownerFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.owner.toLowerCase().includes(q) ||
            t.sourceMeetingTitle.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return priorityRank[a.priority] - priorityRank[b.priority];
        }
        if (sortBy === 'status') {
          return statusRank[a.status] - statusRank[b.status];
        }
        // Sort by deadline ascending (Unspecified at bottom)
        const da = a.deadline === 'Unspecified' ? '9999-12-31' : a.deadline;
        const db = b.deadline === 'Unspecified' ? '9999-12-31' : b.deadline;
        return da.localeCompare(db);
      });
  }, [state.tasks, statusFilter, priorityFilter, ownerFilter, searchQuery, sortBy]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setOwner('Elena Rostova');
    setPriority('High');
    setDeadline('2026-11-06');
    setSourceMeetingId(state.meetings[0]?.id || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: ActionItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setOwner(task.owner);
    setPriority(task.priority);
    setDeadline(task.deadline === 'Unspecified' ? '' : task.deadline);
    setSourceMeetingId(task.sourceMeetingId);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (title.trim().length < 3) {
      setFormError('Task title must be at least 3 characters.');
      return;
    }

    try {
      if (editingTask) {
        await onUpdateTask(editingTask.id, {
          title,
          description,
          owner: owner.trim() || 'Unassigned',
          priority,
          deadline: deadline.trim() || 'Unspecified',
        });
      } else {
        await onCreateTask({
          title,
          description,
          owner: owner.trim() || 'Unassigned',
          priority,
          deadline: deadline.trim() || 'Unspecified',
          sourceMeetingId,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save task.');
    }
  };

  const overdueCount = state.tasks.filter((t) => t.status === 'overdue').length;
  const pendingCount = state.tasks.filter((t) => t.status === 'pending').length;
  const completedCount = state.tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6" data-testid="tasks-view">
      {/* Header & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Action Item &amp; Task Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track ownership, priority, deadlines, source meeting lineage, and status audit trails
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Action Item
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Interactive Status Segmented Control */}
        <div
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto"
          role="group"
          aria-label="Filter tasks by status"
        >
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({state.tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === 'overdue'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search + Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search tasks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, owners, meetings..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            aria-label="Filter by owner"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
          >
            <option value="all">All Owners</option>
            {ownersList.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort tasks by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'deadline' | 'priority' | 'status')}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action Item &amp; Source Lineage</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Deadline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const isOverdue = task.status === 'overdue';
                const isCarried = task.carriedFromMeetingIds.length > 0;

                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isOverdue ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          onToggleTaskStatus(task.id, isCompleted ? 'pending' : 'completed')
                        }
                        aria-label={
                          isCompleted
                            ? `Reopen "${task.title}"`
                            : `Complete "${task.title}"`
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium group"
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700 group-hover:underline">
                              Completed
                            </span>
                          </>
                        ) : isOverdue ? (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-red-700 font-semibold group-hover:underline">
                              Overdue
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-700 group-hover:underline">Pending</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div
                        className={`font-medium ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>Origin: {task.sourceMeetingTitle}</span>
                        {isCarried && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-blue-700 font-medium inline-flex items-center gap-1">
                              <CornerDownRight className="w-3 h-3" />
                              Carried to: {task.currentMeetingTitle}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs">
                        <ParticipantAvatar
                          name={task.owner}
                          participants={state.participants}
                          size="sm"
                        />
                        <span
                          className={
                            task.owner === 'Unassigned'
                              ? 'text-amber-700 font-medium'
                              : 'text-slate-900 font-medium'
                          }
                        >
                          {task.owner}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs">
                      <span
                        className={
                          task.priority === 'High'
                            ? 'text-red-700 font-semibold'
                            : task.priority === 'Medium'
                            ? 'text-slate-800 font-medium'
                            : 'text-slate-500'
                        }
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap text-right font-mono tabular-nums text-xs">
                      <span
                        className={
                          isOverdue
                            ? 'text-red-700 font-semibold'
                            : task.deadline === 'Unspecified'
                            ? 'text-slate-400'
                            : 'text-slate-700'
                        }
                      >
                        {task.deadline}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setHistoryTask(task)}
                          aria-label={`View status history for ${task.title}`}
                          title="Status History"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          aria-label={`Edit ${task.title}`}
                          title="Edit Task"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Delete ${task.title}`}
                          title="Delete Task"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      No matching action items found
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Adjust your search query or filters, or create a new action item.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Task Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 id="task-modal-title" className="text-base font-semibold text-slate-900">
                {editingTask ? 'Edit Action Item' : 'Create New Action Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close task modal"
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
                <label
                  htmlFor="task-title-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Action Item Title
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Verify Frankfurt backup snapshot encryption"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="task-desc-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Description / Acceptance Criteria
                </label>
                <textarea
                  id="task-desc-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="task-owner-input"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Owner
                  </label>
                  <input
                    id="task-owner-input"
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Name or Unassigned"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-priority-select"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Priority
                  </label>
                  <select
                    id="task-priority-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-deadline-input"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Deadline (YYYY-MM-DD)
                  </label>
                  <input
                    id="task-deadline-input"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {!editingTask && (
                <div>
                  <label
                    htmlFor="task-meeting-select"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Source Meeting
                  </label>
                  <select
                    id="task-meeting-select"
                    value={sourceMeetingId}
                    onChange={(e) => setSourceMeetingId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    {state.meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.date} — {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  {editingTask ? 'Save Task Updates' : 'Create Action Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status History Audit Trail Modal */}
      {historyTask && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 id="history-modal-title" className="text-base font-semibold text-slate-900">
                  Task Status &amp; Lineage History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{historyTask.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTask(null)}
                aria-label="Close history modal"
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <div>
                  <span className="text-slate-500">Original Source Meeting: </span>
                  <span className="font-medium text-slate-900">
                    {historyTask.sourceMeetingTitle}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Current Active Meeting: </span>
                  <span className="font-medium text-slate-900">
                    {historyTask.currentMeetingTitle}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded">
                {historyTask.statusHistory.map((entry, idx) => (
                  <div key={idx} className="p-3 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 font-mono tabular-nums">
                      <span>
                        {entry.fromStatus} → {entry.toStatus}
                      </span>
                      <span>{entry.timestamp.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-slate-800">{entry.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
