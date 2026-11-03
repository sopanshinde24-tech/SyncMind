import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Columns3,
  CornerDownRight,
  Edit3,
  GripVertical,
  History,
  List,
  PlayCircle,
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
  onToggleTaskStatus: (taskId: string, nextStatus: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

type KanbanColumnId = 'pending' | 'in-progress' | 'completed';

export const TasksView: React.FC<TasksViewProps> = ({
  state,
  onCreateTask,
  onUpdateTask,
  onToggleTaskStatus,
  onDeleteTask,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'status'>('deadline');

  // Drag-and-Drop Kanban State & PwC Consulting Column Task Limits (WIP Capacity)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(null);
  const [columnTaskLimits, setColumnTaskLimits] = useState<Record<KanbanColumnId, number>>({
    pending: 4,
    'in-progress': 3,
    completed: 6,
  });

  const adjustColumnLimit = (colId: KanbanColumnId, delta: number) => {
    setColumnTaskLimits((prev) => ({
      ...prev,
      [colId]: Math.max(1, Math.min(15, prev[colId] + delta)),
    }));
  };

  // Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ActionItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('Ananya Sharma');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [deadline, setDeadline] = useState('2026-11-06');
  const [sourceMeetingId, setSourceMeetingId] = useState(state.meetings[0]?.id || '');
  const [formError, setFormError] = useState<string | null>(null);

  // Slide-over Task Detail Drawer & Delete Confirmation State
  const [historyTask, setHistoryTask] = useState<ActionItem | null>(null);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);

  const ownersList = useMemo(() => {
    const set = new Set<string>(state.participants.map((p) => p.name));
    state.tasks.forEach((t) => set.add(t.owner));
    return Array.from(set);
  }, [state.participants, state.tasks]);

  const filteredTasks = useMemo(() => {
    const priorityRank: Record<TaskPriority, number> = { High: 1, Medium: 2, Low: 3 };
    const statusRank: Record<TaskStatus, number> = {
      overdue: 1,
      'in-progress': 2,
      pending: 3,
      completed: 4,
    };

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
        const da = a.deadline === 'Unspecified' ? '9999-12-31' : a.deadline;
        const db = b.deadline === 'Unspecified' ? '9999-12-31' : b.deadline;
        return da.localeCompare(db);
      });
  }, [state.tasks, statusFilter, priorityFilter, ownerFilter, searchQuery, sortBy]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setOwner('Ananya Sharma');
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

  const handleKanbanDrop = async (targetColumn: KanbanColumnId, explicitTaskId?: string) => {
    const taskId = explicitTaskId || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverColumn(null);
    if (!taskId) return;

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentMappedColumn: KanbanColumnId =
      task.status === 'completed'
        ? 'completed'
        : task.status === 'in-progress'
        ? 'in-progress'
        : 'pending';

    if (currentMappedColumn === targetColumn) return;
    await onToggleTaskStatus(taskId, targetColumn);
  };

  const overdueCount = state.tasks.filter((t) => t.status === 'overdue').length;
  const pendingCount = state.tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = state.tasks.filter((t) => t.status === 'in-progress').length;
  const completedCount = state.tasks.filter((t) => t.status === 'completed').length;

  // Keep drawer synced with updated state
  const activeDrawerTask = historyTask
    ? state.tasks.find((t) => t.id === historyTask.id) || historyTask
    : null;

  return (
    <div className="space-y-6" data-testid="tasks-view">
      {/* Header & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
            Action Item Management
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Action Item Ledger &amp; Kanban Workflow Board
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track ownership, priority, deadlines, source meeting lineage, and drag-and-drop workflow
            progression across Pending, In Progress, and Completed columns
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* View Toggle: List vs Kanban */}
          <div
            className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200"
            role="group"
            aria-label="Toggle task view mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              data-testid="tasks-view-mode-list"
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              data-testid="tasks-view-mode-kanban"
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Kanban Board
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Action Item
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        {/* Interactive Status Segmented Control */}
        <div
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto"
          role="group"
          aria-label="Filter tasks by status"
        >
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({state.tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'overdue'
                ? 'bg-white text-red-600 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in-progress')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'in-progress'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search + Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search tasks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, owners, meetings..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
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
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
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
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      {/* Delete Confirmation Alert */}
      {confirmDeleteTaskId && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-red-900">
            <strong>Confirm deletion:</strong> Are you sure you want to permanently remove this
            action item?
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await onDeleteTask(confirmDeleteTaskId);
                if (historyTask?.id === confirmDeleteTaskId) {
                  setHistoryTask(null);
                }
                setConfirmDeleteTaskId(null);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
            >
              Confirm Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteTaskId(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: High-Density Data Table */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Action Item &amp; Source Lineage</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4 text-right">Deadline</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const isOverdue = task.status === 'overdue';
                  const isInProgress = task.status === 'in-progress';
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
                          className="inline-flex items-center gap-1.5 text-xs font-medium group cursor-pointer"
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
                              <span className="text-red-600 font-semibold group-hover:underline">
                                Overdue
                              </span>
                            </>
                          ) : isInProgress ? (
                            <>
                              <PlayCircle className="w-4 h-4 text-indigo-600" />
                              <span className="text-indigo-700 font-semibold group-hover:underline">
                                In Progress
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
                        <button
                          type="button"
                          onClick={() => setHistoryTask(task)}
                          className={`text-left font-medium hover:text-indigo-600 transition-colors cursor-pointer ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </button>
                        <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Origin: {task.sourceMeetingTitle}</span>
                          {isCarried && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-indigo-600 font-medium inline-flex items-center gap-1">
                                <CornerDownRight className="w-3 h-3" />
                                Carried to: {task.currentMeetingTitle}
                              </span>
                            </>
                          )}
                          {task.dependencies && task.dependencies.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-600 font-mono text-[11px]">
                                Dep: {task.dependencies[0]}
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
                              ? 'text-red-600 font-semibold'
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
                              ? 'text-red-600 font-semibold'
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
                            title="Task Details & Lineage"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            aria-label={`Edit ${task.title}`}
                            title="Edit Task"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTaskId(task.id)}
                            aria-label={`Delete ${task.title}`}
                            title="Delete Task"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
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
      ) : (
        /* VIEW MODE 2: Enterprise Kanban Board (Pending, In Progress, Completed with Drag-and-Drop & PwC Task Limit Counters) */
        <div className="space-y-4" data-testid="tasks-kanban-board">
          {/* PwC Consulting Team Capacity & WIP Bottleneck Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold text-[11px]">
                PwC Consulting WIP Controls
              </span>
              <span>
                Drag and drop cards across <strong>Pending</strong>, <strong>In Progress</strong>, and{' '}
                <strong>Completed</strong> columns. Column <strong>Task Limits</strong> highlight
                delivery capacity across Gurugram, Bengaluru &amp; Mumbai leads.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
              <span className="text-slate-500">
                Active Delivery Leads: <strong className="text-slate-800">{state.participants.length}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                Displayed Tasks: <strong className="text-slate-800">{filteredTasks.length}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(
              [
                {
                  id: 'pending' as KanbanColumnId,
                  label: 'Pending',
                  roleContext: 'Backlog & Intake Queue (PwC Advisory / Legal)',
                  subtitle: 'Queued & overdue action items awaiting active execution',
                  accent: 'border-t-4 border-t-amber-500',
                  badge: 'text-amber-800 bg-amber-50',
                  barColor: 'bg-amber-500',
                  filterFn: (t: ActionItem) => t.status === 'pending' || t.status === 'overdue',
                },
                {
                  id: 'in-progress' as KanbanColumnId,
                  label: 'In Progress',
                  roleContext: 'Active Consulting Sprint WIP (Engineering & Governance)',
                  subtitle: 'Active sprint deliverables currently in execution',
                  accent: 'border-t-4 border-t-indigo-600',
                  badge: 'text-indigo-700 bg-indigo-50',
                  barColor: 'bg-indigo-600',
                  filterFn: (t: ActionItem) => t.status === 'in-progress',
                },
                {
                  id: 'completed' as KanbanColumnId,
                  label: 'Completed',
                  roleContext: 'Verified Client Deliverables (Sprint Target)',
                  subtitle: 'Verified & closed deliverables with audit timestamp',
                  accent: 'border-t-4 border-t-emerald-600',
                  badge: 'text-emerald-700 bg-emerald-50',
                  barColor: 'bg-emerald-600',
                  filterFn: (t: ActionItem) => t.status === 'completed',
                },
              ] as const
            ).map((col) => {
              const colTasks = filteredTasks.filter(col.filterFn);
              const isDropTarget = dragOverColumn === col.id;
              const taskLimit = columnTaskLimits[col.id];
              const isOverLimit = col.id !== 'completed' && colTasks.length > taskLimit;
              const isAtLimit = col.id !== 'completed' && colTasks.length === taskLimit;
              const utilizationPct = Math.min(100, Math.round((colTasks.length / Math.max(1, taskLimit)) * 100));

              return (
                <div
                  key={col.id}
                  data-testid={`kanban-col-${col.id}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverColumn !== col.id) {
                      setDragOverColumn(col.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverColumn === col.id) {
                      setDragOverColumn(null);
                    }
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const droppedId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                    if (droppedId) {
                      await handleKanbanDrop(col.id, droppedId);
                    }
                  }}
                  className={`bg-white border rounded-xl ${col.accent} p-4 space-y-3 shadow-2xs transition-colors min-h-[380px] flex flex-col ${
                    isDropTarget
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                      : isOverLimit
                      ? 'border-red-300 bg-red-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Column Header with Visual 'Task limit' Counter & Capacity Telemetry */}
                  <div className="pb-3 border-b border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{col.label}</span>
                        <span className="block text-[10px] font-mono text-slate-400">
                          {col.roleContext}
                        </span>
                      </div>

                      {/* Visual 'Task limit' Counter Pill + Adjusters */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          data-testid={`kanban-task-limit-${col.id}`}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold tabular-nums border inline-flex items-center gap-1 ${
                            isOverLimit
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isAtLimit
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : col.badge + ' border-transparent'
                          }`}
                          title="Column Task Limit (Work-In-Progress team capacity threshold)"
                        >
                          <span>Task Limit:</span>
                          <span data-testid={`kanban-count-${col.id}`}>
                            {colTasks.length}
                          </span>
                          <span>/</span>
                          <span>{taskLimit}</span>
                        </div>

                        <div
                          className="inline-flex items-center border border-slate-200 rounded bg-slate-50"
                          role="group"
                          aria-label={`Adjust ${col.label} task limit`}
                        >
                          <button
                            type="button"
                            onClick={() => adjustColumnLimit(col.id, -1)}
                            title={`Decrease ${col.label} task limit`}
                            data-testid={`decrease-limit-${col.id}`}
                            className="px-1.5 py-0.5 text-[10px] font-mono text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustColumnLimit(col.id, 1)}
                            title={`Increase ${col.label} task limit`}
                            data-testid={`increase-limit-${col.id}`}
                            className="px-1.5 py-0.5 text-[10px] font-mono text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-l border-slate-200 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Team Capacity Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOverLimit
                            ? 'bg-red-600'
                            : isAtLimit
                            ? 'bg-amber-500'
                            : col.barColor
                        }`}
                        style={{ width: `${utilizationPct}%` }}
                      />
                    </div>

                    {/* Capacity / Bottleneck Status Subtitle */}
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-400 truncate">{col.subtitle}</span>
                      {isOverLimit ? (
                        <span
                          className="text-red-600 font-mono font-semibold shrink-0 inline-flex items-center gap-1"
                          data-testid={`kanban-bottleneck-${col.id}`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Bottleneck (+{colTasks.length - taskLimit})
                        </span>
                      ) : isAtLimit ? (
                        <span
                          className="text-amber-700 font-mono font-semibold shrink-0"
                          data-testid={`kanban-bottleneck-${col.id}`}
                        >
                          At Capacity (100%)
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono shrink-0">
                          {Math.max(0, taskLimit - colTasks.length)} slot(s) open
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    {colTasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      const isOverdue = task.status === 'overdue';
                      const isDragging = draggedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          data-testid={`kanban-card-${task.id}`}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', task.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedTaskId(task.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverColumn(null);
                          }}
                          className={`p-3.5 rounded-xl bg-slate-50/80 border transition-all space-y-2.5 cursor-grab active:cursor-grabbing ${
                            isDragging
                              ? 'opacity-50 border-indigo-400 scale-[0.99]'
                              : isOverdue
                              ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                              : 'border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span
                                className={`font-semibold ${
                                  task.priority === 'High'
                                    ? 'text-red-600'
                                    : task.priority === 'Medium'
                                    ? 'text-indigo-700'
                                    : 'text-slate-500'
                                }`}
                              >
                                {task.priority} Priority
                              </span>
                              {isOverdue && (
                                <span className="text-red-600 font-mono font-bold uppercase">
                                  · OVERDUE
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-mono tabular-nums ${
                                isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'
                              }`}
                            >
                              Due {task.deadline}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setHistoryTask(task)}
                            className="text-left text-xs font-semibold text-slate-900 hover:text-indigo-600 block cursor-pointer"
                          >
                            {task.title}
                          </button>

                          <div className="text-[11px] text-slate-500 truncate">
                            Origin: {task.sourceMeetingTitle.split('—')[0].trim()}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 gap-2">
                            <div className="flex items-center gap-1.5 text-xs min-w-0">
                              <ParticipantAvatar
                                name={task.owner}
                                participants={state.participants}
                                size="sm"
                              />
                              <span className="text-slate-700 font-medium truncate">
                                {task.owner}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {col.id !== 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleKanbanDrop('pending', task.id)}
                                  title="Move to Pending"
                                  data-testid={`move-to-pending-${task.id}`}
                                  className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-amber-700 bg-white border border-slate-200 rounded cursor-pointer"
                                >
                                  Pending
                                </button>
                              )}
                              {col.id !== 'in-progress' && (
                                <button
                                  type="button"
                                  onClick={() => handleKanbanDrop('in-progress', task.id)}
                                  title="Move to In Progress"
                                  data-testid={`move-to-in-progress-${task.id}`}
                                  className="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  Start
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                              {!isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => handleKanbanDrop('completed', task.id)}
                                  title="Move to Completed"
                                  data-testid={`move-to-completed-${task.id}`}
                                  className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded cursor-pointer"
                                >
                                  Done
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Drop tasks here to mark <strong>{col.label}</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 id="task-modal-title" className="text-base font-semibold text-slate-900">
                {editingTask ? 'Edit Action Item' : 'Create New Action Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close task modal"
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
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
                  placeholder="e.g., Verify Mumbai BFSI RAG telemetry encryption"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  {editingTask ? 'Save Task Updates' : 'Create Action Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Over Task Details & Status History Audit Drawer */}
      {activeDrawerTask && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
          data-testid="task-details-drawer"
          onClick={() => setHistoryTask(null)}
        >
          <div
            className="bg-white border-l border-slate-200 max-w-md w-full h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">
                    Task Details &amp; Audit Lineage
                  </span>
                  <h3
                    id="history-modal-title"
                    className="text-base font-bold text-slate-900 mt-0.5"
                  >
                    {activeDrawerTask.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryTask(null)}
                  aria-label="Close history modal"
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {activeDrawerTask.description || 'No additional description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-slate-400 text-[11px]">Assigned Owner</div>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {activeDrawerTask.owner}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-slate-400 text-[11px]">Due Date</div>
                    <div className="font-mono font-semibold text-slate-900 mt-0.5">
                      {activeDrawerTask.deadline}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-slate-400 text-[11px]">Priority</div>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {activeDrawerTask.priority}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-slate-400 text-[11px]">Current Status</div>
                    <div className="font-semibold uppercase text-indigo-700 mt-0.5">
                      {activeDrawerTask.status}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-1.5">
                  <div>
                    <span className="text-slate-500">Original Source Meeting: </span>
                    <span className="font-semibold text-slate-900">
                      {activeDrawerTask.sourceMeetingTitle}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Current Active Meeting: </span>
                    <span className="font-semibold text-slate-900">
                      {activeDrawerTask.currentMeetingTitle}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">
                    Status &amp; Carry-Forward History ({activeDrawerTask.statusHistory.length})
                  </h4>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                    {activeDrawerTask.statusHistory.map((entry, idx) => (
                      <div key={idx} className="p-3 space-y-1 bg-white">
                        <div className="flex items-center justify-between text-slate-500 font-mono tabular-nums text-[11px]">
                          <span className="font-semibold text-indigo-700">
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

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  openEditModal(activeDrawerTask);
                  setHistoryTask(null);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Edit Fields
              </button>
              <div className="flex items-center gap-2">
                {activeDrawerTask.status !== 'in-progress' &&
                  activeDrawerTask.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => onToggleTaskStatus(activeDrawerTask.id, 'in-progress')}
                      className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                    >
                      Move to In Progress
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() =>
                    onToggleTaskStatus(
                      activeDrawerTask.id,
                      activeDrawerTask.status === 'completed' ? 'pending' : 'completed'
                    )
                  }
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  {activeDrawerTask.status === 'completed'
                    ? 'Reopen Action Item'
                    : 'Mark as Completed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
