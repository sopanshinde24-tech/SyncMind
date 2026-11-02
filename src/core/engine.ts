import {
  ActionItem,
  AIAnalysisResult,
  AIExtractedBlockerDraft,
  AIExtractedDecisionDraft,
  AIExtractedTaskDraft,
  AppDatabaseState,
  Blocker,
  CarryForwardRecord,
  DashboardMetrics,
  Decision,
  HandoverRecord,
  Meeting,
  TaskPriority,
  TaskStatus,
  WeeklyReportData,
} from './types';
import { createInitialSeedState, REFERENCE_DATE } from './seedData';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function computeTaskStatus(
  currentStatus: TaskStatus,
  deadline: string,
  referenceDate: string = REFERENCE_DATE
): TaskStatus {
  if (currentStatus === 'completed') return 'completed';
  if (!deadline || deadline === 'Unspecified') return 'pending';
  if (deadline < referenceDate) {
    return 'overdue';
  }
  return 'pending';
}

export function validateMeetingInput(input: {
  title?: string;
  date?: string;
  participants?: string[];
  agenda?: string;
}): ValidationResult {
  const errors: string[] = [];
  if (!input.title || input.title.trim().length < 3) {
    errors.push('Meeting title must be at least 3 characters long.');
  }
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date.trim())) {
    errors.push('Meeting date must be a valid YYYY-MM-DD date.');
  }
  if (!input.participants || input.participants.filter((p) => p.trim().length > 0).length === 0) {
    errors.push('At least one participant is required.');
  }
  if (!input.agenda || input.agenda.trim().length < 5) {
    errors.push('Meeting agenda must be at least 5 characters long.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateTaskInput(input: {
  title?: string;
  owner?: string;
  priority?: string;
  sourceMeetingId?: string;
}): ValidationResult {
  const errors: string[] = [];
  if (!input.title || input.title.trim().length < 3) {
    errors.push('Task title must be at least 3 characters long.');
  }
  if (input.priority && !['High', 'Medium', 'Low'].includes(input.priority)) {
    errors.push('Priority must be High, Medium, or Low.');
  }
  if (!input.sourceMeetingId || input.sourceMeetingId.trim().length === 0) {
    errors.push('Source meeting is required.');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates and sanitizes raw AI output so missing owners/deadlines are never fabricated
 * and always normalized to "Unassigned" or "Unspecified".
 */
export function validateAIAnalysisOutput(raw: unknown): AIAnalysisResult {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  const summary =
    typeof obj.summary === 'string' && obj.summary.trim().length > 0
      ? obj.summary.trim()
      : 'Summary not specified in source transcript.';

  const rawDecisions = Array.isArray(obj.decisions) ? obj.decisions : [];
  const decisions: AIExtractedDecisionDraft[] = rawDecisions
    .map((d: unknown) => {
      const item = (typeof d === 'object' && d !== null ? d : {}) as Record<string, unknown>;
      const decisionSummary = typeof item.summary === 'string' ? item.summary.trim() : '';
      if (!decisionSummary) return null;
      const owner =
        typeof item.owner === 'string' && item.owner.trim().length > 0
          ? item.owner.trim()
          : 'Unspecified';
      const impactArea =
        typeof item.impactArea === 'string' && item.impactArea.trim().length > 0
          ? item.impactArea.trim()
          : 'General Operations';
      return { summary: decisionSummary, owner, impactArea };
    })
    .filter((d): d is AIExtractedDecisionDraft => d !== null);

  const rawTasks = Array.isArray(obj.actionItems) ? obj.actionItems : [];
  const actionItems: AIExtractedTaskDraft[] = rawTasks
    .map((t: unknown) => {
      const item = (typeof t === 'object' && t !== null ? t : {}) as Record<string, unknown>;
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      if (!title) return null;
      const description =
        typeof item.description === 'string' && item.description.trim().length > 0
          ? item.description.trim()
          : title;
      const rawOwner = typeof item.owner === 'string' ? item.owner.trim() : '';
      const owner =
        !rawOwner ||
        /^(none|null|n\/a|unknown|tbd|unassigned|not specified|unspecified)$/i.test(rawOwner)
          ? 'Unassigned'
          : rawOwner;

      const rawDeadline = typeof item.deadline === 'string' ? item.deadline.trim() : '';
      const deadline =
        !rawDeadline ||
        /^(none|null|n\/a|unknown|tbd|unspecified|not specified)$/i.test(rawDeadline)
          ? 'Unspecified'
          : rawDeadline;

      const rawPriority = typeof item.priority === 'string' ? item.priority.trim() : 'Medium';
      const priority: TaskPriority =
        rawPriority === 'High' || rawPriority === 'Medium' || rawPriority === 'Low'
          ? rawPriority
          : 'Medium';

      return { title, description, owner, priority, deadline };
    })
    .filter((t): t is AIExtractedTaskDraft => t !== null);

  const rawBlockers = Array.isArray(obj.blockers) ? obj.blockers : [];
  const blockers: AIExtractedBlockerDraft[] = rawBlockers
    .map((b: unknown) => {
      const item = (typeof b === 'object' && b !== null ? b : {}) as Record<string, unknown>;
      const description = typeof item.description === 'string' ? item.description.trim() : '';
      if (!description) return null;
      const rawOwner = typeof item.owner === 'string' ? item.owner.trim() : '';
      const owner =
        !rawOwner ||
        /^(none|null|n\/a|unknown|tbd|unassigned|not specified|unspecified)$/i.test(rawOwner)
          ? 'Unassigned'
          : rawOwner;
      const rawSeverity = typeof item.severity === 'string' ? item.severity.trim() : 'Medium';
      const severity: 'High' | 'Medium' | 'Low' =
        rawSeverity === 'High' || rawSeverity === 'Medium' || rawSeverity === 'Low'
          ? rawSeverity
          : 'Medium';
      return { description, owner, severity };
    })
    .filter((b): b is AIExtractedBlockerDraft => b !== null);

  const rawNextSteps = Array.isArray(obj.nextSteps) ? obj.nextSteps : [];
  const nextSteps = rawNextSteps
    .map((s: unknown) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s) => s.length > 0);

  return {
    summary,
    decisions,
    actionItems,
    blockers,
    nextSteps:
      nextSteps.length > 0
        ? nextSteps
        : ['Review extracted action items and confirm owner assignments.'],
    sourceEngine: obj.sourceEngine === 'gemini' ? 'gemini' : 'deterministic-fallback',
    analyzedAt:
      typeof obj.analyzedAt === 'string' ? obj.analyzedAt : new Date().toISOString(),
  };
}

/**
 * Deterministic source-grounded transcript analyzer.
 * Parses speakers, decisions, action items, owners, deadlines, and blockers directly from text.
 * Never fabricates owners or dates absent from the transcript.
 */
export function extractMeetingDeterministic(
  transcript: string,
  notes: string = ''
): AIAnalysisResult {
  const combined = `${transcript}\n${notes}`.trim();
  const lines = combined
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const decisions: AIExtractedDecisionDraft[] = [];
  const actionItems: AIExtractedTaskDraft[] = [];
  const blockers: AIExtractedBlockerDraft[] = [];
  const nextSteps: string[] = [];
  const speakers = new Set<string>();

  for (const line of lines) {
    // Parse speaker if format is [00:00:00] Speaker Name: text or Speaker Name: text
    const speakerMatch = line.match(/^(?:\[\d{2}:\d{2}(?::\d{2})?\]\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?):\s*(.+)$/);
    const currentSpeaker = speakerMatch ? speakerMatch[1].trim() : '';
    const content = speakerMatch ? speakerMatch[2].trim() : line;
    if (currentSpeaker && !/^(Decision|Action|Blocker|Note|Agenda)$/i.test(currentSpeaker)) {
      speakers.add(currentSpeaker);
    }

    // Check for Decisions
    const decisionRegex = /(?:Decision(?:\s+made)?|Agreed\s+decision|We\s+decided)\s*:\s*([^.]+(?:\.[^.]+)?)/i;
    const decMatch = content.match(decisionRegex);
    if (decMatch) {
      decisions.push({
        summary: decMatch[1].trim().replace(/\.$/, '') + '.',
        owner: currentSpeaker || 'Unspecified',
        impactArea: content.toLowerCase().includes('sla')
          ? 'Enterprise SLA & Operations'
          : content.toLowerCase().includes('migration') || content.toLowerCase().includes('schema')
          ? 'Platform Infrastructure'
          : 'Operations & Execution',
      });
    }

    // Check for Blockers
    const blockerRegex = /(?:blocker|blocked\s+by)\s*:\s*([^.]+(?:\.[^.]+)?)/i;
    const blkMatch = content.match(blockerRegex);
    if (blkMatch) {
      const severity: 'High' | 'Medium' | 'Low' = /high[- ]severity|urgent|critical/i.test(content)
        ? 'High'
        : 'Medium';
      blockers.push({
        description: blkMatch[1].trim().replace(/\.$/, '') + '.',
        owner: currentSpeaker || 'Unassigned',
        severity,
      });
    }

    // Check for Action Items
    const dateMatch = content.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    const deadline = dateMatch ? dateMatch[1] : 'Unspecified';
    const priority: TaskPriority = /priority\s+is\s+high|urgent|critical|high\s+priority/i.test(
      content
    )
      ? 'High'
      : /priority\s+is\s+low|low\s+priority/i.test(content)
      ? 'Low'
      : 'Medium';

    // Pattern 1: "I will <action>" or "Action item for me: I will <action>" or "I need to <action>"
    const selfActionMatch = content.match(
      /(?:Action item for me:\s*)?(?:I\s+will|I\s+need\s+to)\s+([^.;]+?)(?:\s+by\s+\d{4}-\d{2}-\d{2}|\.|$)/i
    );
    if (selfActionMatch && !/completed\s+the\s+initial/i.test(selfActionMatch[1])) {
      const rawTitle = selfActionMatch[1].trim();
      const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      actionItems.push({
        title: cleanTitle,
        description: `${cleanTitle}${deadline !== 'Unspecified' ? ` (Target due date: ${deadline})` : ''}.`,
        owner: currentSpeaker || 'Unassigned',
        priority,
        deadline,
      });
    }

    // Pattern 2: Unassigned action mentioned ("We also need someone to <action>")
    const unassignedMatch = content.match(
      /(?:We\s+(?:also\s+)?need\s+someone\s+to|Unassigned\s+action\s+item:)\s+([^,;]+?)(?:,\s+though|\s+by\s+\d{4}-\d{2}-\d{2}|\.|$)/i
    );
    if (unassignedMatch) {
      const rawTitle = unassignedMatch[1].trim();
      const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      actionItems.push({
        title: cleanTitle,
        description: `${cleanTitle} (Owner and deadline not specified in source discussion).`,
        owner: 'Unassigned',
        priority: 'Medium',
        deadline: 'Unspecified',
      });
    }
  }

  // Fallback if freeform notes were pasted without standard phrasing
  if (actionItems.length === 0 && lines.length > 0) {
    for (const line of lines) {
      if (/\b(todo|action|task|follow[- ]up)\b/i.test(line)) {
        const dateMatch = line.match(/\b(\d{4}-\d{2}-\d{2})\b/);
        actionItems.push({
          title: line.replace(/^(todo|action|task)\s*:\s*/i, '').trim(),
          description: line.trim(),
          owner: 'Unassigned',
          priority: 'Medium',
          deadline: dateMatch ? dateMatch[1] : 'Unspecified',
        });
      }
    }
  }

  const speakerList = Array.from(speakers);
  const summary =
    speakerList.length > 0
      ? `Meeting discussion among ${speakerList.join(', ')} covered operational progress, key execution decisions (${decisions.length} recorded), and ${actionItems.length} action items (${actionItems.filter((a) => a.owner === 'Unassigned').length} unassigned). ${
          blockers.length > 0
            ? `${blockers.length} operational blocker(s) were flagged for resolution.`
            : 'No critical blockers were reported.'
        }`
      : `Extracted structured summary from provided meeting text (${decisions.length} decisions, ${actionItems.length} action items, and ${blockers.length} blockers identified).`;

  if (actionItems.some((a) => a.owner === 'Unassigned' || a.deadline === 'Unspecified')) {
    nextSteps.push(
      'Assign owners and target deadlines to items marked Unassigned or Unspecified during human review'
    );
  }
  if (blockers.length > 0) {
    nextSteps.push(`Resolve ${blockers.length} active blocker(s) identified in transcript`);
  }
  nextSteps.push('Track approved action items and carry forward any incomplete tasks from prior syncs');

  return validateAIAnalysisOutput({
    summary,
    decisions,
    actionItems,
    blockers,
    nextSteps,
    sourceEngine: 'deterministic-fallback',
    analyzedAt: new Date().toISOString(),
  });
}

export function createMeeting(
  state: AppDatabaseState,
  payload: {
    title: string;
    date: string;
    startTime?: string;
    durationMinutes?: number;
    participants: string[];
    agenda: string;
    notes?: string;
    transcript?: string;
  }
): AppDatabaseState {
  const validation = validateMeetingInput(payload);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const newMeeting: Meeting = {
    id: `mtg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: payload.title.trim(),
    date: payload.date.trim(),
    startTime: payload.startTime?.trim() || '10:00 AM',
    durationMinutes: payload.durationMinutes || 45,
    participants: payload.participants.map((p) => p.trim()).filter(Boolean),
    agenda: payload.agenda.trim(),
    notes: payload.notes?.trim() || '',
    transcript: payload.transcript?.trim() || '',
    carriedTaskIds: [],
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    meetings: [newMeeting, ...state.meetings],
    lastUpdated: new Date().toISOString(),
  };
}

export function updateMeeting(
  state: AppDatabaseState,
  meetingId: string,
  updates: Partial<Pick<Meeting, 'title' | 'date' | 'startTime' | 'durationMinutes' | 'participants' | 'agenda' | 'notes' | 'transcript'>>
): AppDatabaseState {
  const existing = state.meetings.find((m) => m.id === meetingId);
  if (!existing) {
    throw new Error(`Meeting ${meetingId} not found.`);
  }

  const merged = {
    ...existing,
    ...updates,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    date: updates.date !== undefined ? updates.date.trim() : existing.date,
    agenda: updates.agenda !== undefined ? updates.agenda.trim() : existing.agenda,
    participants: updates.participants !== undefined ? updates.participants : existing.participants,
  };

  const validation = validateMeetingInput(merged);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  return {
    ...state,
    meetings: state.meetings.map((m) => (m.id === meetingId ? merged : m)),
    tasks: state.tasks.map((t) => ({
      ...t,
      sourceMeetingTitle:
        t.sourceMeetingId === meetingId ? merged.title : t.sourceMeetingTitle,
      currentMeetingTitle:
        t.currentMeetingId === meetingId ? merged.title : t.currentMeetingTitle,
    })),
    lastUpdated: new Date().toISOString(),
  };
}

export function deleteMeeting(state: AppDatabaseState, meetingId: string): AppDatabaseState {
  return {
    ...state,
    meetings: state.meetings.filter((m) => m.id !== meetingId),
    decisions: state.decisions.filter((d) => d.meetingId !== meetingId),
    blockers: state.blockers.filter((b) => b.meetingId !== meetingId),
    lastUpdated: new Date().toISOString(),
  };
}

export function createTask(
  state: AppDatabaseState,
  payload: {
    title: string;
    description?: string;
    owner?: string;
    priority?: TaskPriority;
    deadline?: string;
    sourceMeetingId: string;
  }
): AppDatabaseState {
  const validation = validateTaskInput(payload);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const meeting = state.meetings.find((m) => m.id === payload.sourceMeetingId);
  const meetingTitle = meeting ? meeting.title : 'General Operations Sync';
  const cleanOwner =
    payload.owner && payload.owner.trim().length > 0 ? payload.owner.trim() : 'Unassigned';
  const cleanDeadline =
    payload.deadline && payload.deadline.trim().length > 0
      ? payload.deadline.trim()
      : 'Unspecified';
  const initialStatus = computeTaskStatus('pending', cleanDeadline, state.referenceDate);
  const now = new Date().toISOString();

  const newTask: ActionItem = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: payload.title.trim(),
    description: payload.description?.trim() || payload.title.trim(),
    owner: cleanOwner,
    priority: payload.priority || 'Medium',
    deadline: cleanDeadline,
    status: initialStatus,
    sourceMeetingId: payload.sourceMeetingId,
    sourceMeetingTitle: meetingTitle,
    currentMeetingId: payload.sourceMeetingId,
    currentMeetingTitle: meetingTitle,
    carriedFromMeetingIds: [],
    statusHistory: [
      {
        timestamp: now,
        fromStatus: 'created',
        toStatus: initialStatus,
        note: `Created under ${meetingTitle}`,
        meetingId: payload.sourceMeetingId,
      },
    ],
    createdAt: now,
  };

  return {
    ...state,
    tasks: [newTask, ...state.tasks],
    lastUpdated: now,
  };
}

export function updateTaskStatus(
  state: AppDatabaseState,
  taskId: string,
  newStatus: TaskStatus,
  note?: string
): AppDatabaseState {
  const existing = state.tasks.find((t) => t.id === taskId);
  if (!existing) {
    throw new Error(`Task ${taskId} not found.`);
  }

  const now = new Date().toISOString();
  const resolvedStatus =
    newStatus === 'completed'
      ? 'completed'
      : computeTaskStatus(newStatus, existing.deadline, state.referenceDate);

  const updatedTask: ActionItem = {
    ...existing,
    status: resolvedStatus,
    completedAt: resolvedStatus === 'completed' ? now : undefined,
    statusHistory: [
      ...existing.statusHistory,
      {
        timestamp: now,
        fromStatus: existing.status,
        toStatus: resolvedStatus,
        note:
          note ||
          (resolvedStatus === 'completed'
            ? 'Marked completed by user.'
            : `Status updated to ${resolvedStatus}.`),
        meetingId: existing.currentMeetingId,
      },
    ],
  };

  return {
    ...state,
    tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    lastUpdated: now,
  };
}

export function updateTask(
  state: AppDatabaseState,
  taskId: string,
  updates: Partial<Pick<ActionItem, 'title' | 'description' | 'owner' | 'priority' | 'deadline' | 'status'>>
): AppDatabaseState {
  const existing = state.tasks.find((t) => t.id === taskId);
  if (!existing) {
    throw new Error(`Task ${taskId} not found.`);
  }

  const nextDeadline =
    updates.deadline !== undefined
      ? updates.deadline.trim() || 'Unspecified'
      : existing.deadline;
  const rawNextStatus = updates.status !== undefined ? updates.status : existing.status;
  const nextStatus =
    rawNextStatus === 'completed'
      ? 'completed'
      : computeTaskStatus(rawNextStatus, nextDeadline, state.referenceDate);
  const now = new Date().toISOString();

  const statusChanged = nextStatus !== existing.status;
  const updatedTask: ActionItem = {
    ...existing,
    ...updates,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    description:
      updates.description !== undefined ? updates.description.trim() : existing.description,
    owner: updates.owner !== undefined ? updates.owner.trim() || 'Unassigned' : existing.owner,
    deadline: nextDeadline,
    status: nextStatus,
    completedAt: nextStatus === 'completed' ? existing.completedAt || now : undefined,
    statusHistory: statusChanged
      ? [
          ...existing.statusHistory,
          {
            timestamp: now,
            fromStatus: existing.status,
            toStatus: nextStatus,
            note: `Task updated (status: ${nextStatus}).`,
            meetingId: existing.currentMeetingId,
          },
        ]
      : existing.statusHistory,
  };

  return {
    ...state,
    tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    lastUpdated: now,
  };
}

export function deleteTask(state: AppDatabaseState, taskId: string): AppDatabaseState {
  return {
    ...state,
    tasks: state.tasks.filter((t) => t.id !== taskId),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Carries an unfinished task from a previous meeting into a target meeting.
 * - Preserves original sourceMeetingId and sourceMeetingTitle.
 * - Appends to carriedFromMeetingIds and statusHistory.
 * - Prevents duplicate carry-forward into the same meeting.
 */
export function carryForwardTask(
  state: AppDatabaseState,
  taskId: string,
  targetMeetingId: string,
  reason: string = 'Unfinished action item carried forward for follow-up review.'
): AppDatabaseState {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found.`);
  }
  if (task.status === 'completed') {
    throw new Error('Completed tasks cannot be carried forward.');
  }
  const targetMeeting = state.meetings.find((m) => m.id === targetMeetingId);
  if (!targetMeeting) {
    throw new Error(`Target meeting ${targetMeetingId} not found.`);
  }
  if (
    task.currentMeetingId === targetMeetingId ||
    targetMeeting.carriedTaskIds.includes(taskId) ||
    state.carryForwardHistory.some(
      (cf) => cf.taskId === taskId && cf.toMeetingId === targetMeetingId
    )
  ) {
    throw new Error(`Task "${task.title}" has already been carried into "${targetMeeting.title}".`);
  }

  const now = new Date().toISOString();
  const fromMeetingId = task.currentMeetingId;
  const fromMeetingTitle = task.currentMeetingTitle;

  const updatedTask: ActionItem = {
    ...task,
    currentMeetingId: targetMeeting.id,
    currentMeetingTitle: targetMeeting.title,
    carriedFromMeetingIds: Array.from(new Set([...task.carriedFromMeetingIds, fromMeetingId])),
    statusHistory: [
      ...task.statusHistory,
      {
        timestamp: now,
        fromStatus: 'carried-forward',
        toStatus: task.status,
        note: `Carried forward from "${fromMeetingTitle}" to "${targetMeeting.title}". Reason: ${reason}`,
        meetingId: targetMeeting.id,
      },
    ],
  };

  const newRecord: CarryForwardRecord = {
    id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    taskId: task.id,
    taskTitle: task.title,
    originalMeetingId: task.sourceMeetingId,
    originalMeetingTitle: task.sourceMeetingTitle,
    fromMeetingId,
    fromMeetingTitle,
    toMeetingId: targetMeeting.id,
    toMeetingTitle: targetMeeting.title,
    owner: task.owner,
    carriedAt: now,
    reason,
  };

  return {
    ...state,
    tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    meetings: state.meetings.map((m) =>
      m.id === targetMeetingId
        ? { ...m, carriedTaskIds: Array.from(new Set([...m.carriedTaskIds, taskId])) }
        : m
    ),
    carryForwardHistory: [newRecord, ...state.carryForwardHistory],
    lastUpdated: now,
  };
}

export function approveAIAnalysisToMeeting(
  state: AppDatabaseState,
  meetingId: string,
  approvedAnalysis: AIAnalysisResult
): AppDatabaseState {
  const meeting = state.meetings.find((m) => m.id === meetingId);
  if (!meeting) {
    throw new Error(`Meeting ${meetingId} not found.`);
  }

  const sanitized = validateAIAnalysisOutput(approvedAnalysis);
  const now = new Date().toISOString();

  const newDecisions: Decision[] = sanitized.decisions.map((d, idx) => ({
    id: `dec-${Date.now()}-${idx}`,
    meetingId: meeting.id,
    meetingTitle: meeting.title,
    summary: d.summary,
    owner: d.owner || 'Unspecified',
    date: meeting.date,
    impactArea: d.impactArea || 'Operations',
  }));

  const newBlockers: Blocker[] = sanitized.blockers.map((b, idx) => ({
    id: `blk-${Date.now()}-${idx}`,
    meetingId: meeting.id,
    meetingTitle: meeting.title,
    description: b.description,
    owner: b.owner || 'Unassigned',
    severity: b.severity || 'Medium',
    status: 'Active',
    reportedAt: meeting.date,
  }));

  // Avoid duplicating tasks with identical title in the same meeting
  const existingTitlesInMeeting = new Set(
    state.tasks
      .filter((t) => t.sourceMeetingId === meeting.id)
      .map((t) => t.title.toLowerCase().trim())
  );

  const newTasks: ActionItem[] = sanitized.actionItems
    .filter((item) => !existingTitlesInMeeting.has(item.title.toLowerCase().trim()))
    .map((item, idx) => {
      const status = computeTaskStatus('pending', item.deadline, state.referenceDate);
      return {
        id: `task-${Date.now()}-${idx}`,
        title: item.title,
        description: item.description || item.title,
        owner: item.owner || 'Unassigned',
        priority: item.priority || 'Medium',
        deadline: item.deadline || 'Unspecified',
        status,
        sourceMeetingId: meeting.id,
        sourceMeetingTitle: meeting.title,
        currentMeetingId: meeting.id,
        currentMeetingTitle: meeting.title,
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: now,
            fromStatus: 'created',
            toStatus: status,
            note: `Approved from AI Meeting Assistant analysis of "${meeting.title}"`,
            meetingId: meeting.id,
          },
        ],
        createdAt: now,
      };
    });

  return {
    ...state,
    meetings: state.meetings.map((m) =>
      m.id === meeting.id
        ? {
            ...m,
            aiSummary: sanitized.summary,
            nextSteps: sanitized.nextSteps,
            aiAnalyzedAt: now,
          }
        : m
    ),
    decisions: [...newDecisions, ...state.decisions],
    blockers: [...newBlockers, ...state.blockers],
    tasks: [...newTasks, ...state.tasks],
    lastUpdated: now,
  };
}

export function createHandover(
  state: AppDatabaseState,
  payload: {
    title: string;
    projectContext: string;
    fromPerson: string;
    toPerson: string;
    completedWork: string[];
    pendingTasks: string[];
    blockers: string[];
    decisions: string[];
    nextSteps: string[];
  }
): AppDatabaseState {
  if (!payload.title.trim() || !payload.fromPerson.trim() || !payload.toPerson.trim()) {
    throw new Error('Handover title, sender, and recipient are required.');
  }

  const now = new Date().toISOString();
  const newHandover: HandoverRecord = {
    id: `hnd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: payload.title.trim(),
    projectContext: payload.projectContext.trim(),
    fromPerson: payload.fromPerson.trim(),
    toPerson: payload.toPerson.trim(),
    createdAt: now,
    completedWork: payload.completedWork.filter(Boolean),
    pendingTasks: payload.pendingTasks.filter(Boolean),
    blockers: payload.blockers.filter(Boolean),
    decisions: payload.decisions.filter(Boolean),
    nextSteps: payload.nextSteps.filter(Boolean),
    status: 'Pending Acknowledgment',
  };

  return {
    ...state,
    handovers: [newHandover, ...state.handovers],
    lastUpdated: now,
  };
}

export function acknowledgeHandover(
  state: AppDatabaseState,
  handoverId: string,
  note: string = 'Handover reviewed and operational ownership accepted.'
): AppDatabaseState {
  const existing = state.handovers.find((h) => h.id === handoverId);
  if (!existing) {
    throw new Error(`Handover ${handoverId} not found.`);
  }
  const now = new Date().toISOString();
  return {
    ...state,
    handovers: state.handovers.map((h) =>
      h.id === handoverId
        ? {
            ...h,
            status: 'Acknowledged',
            acknowledgedAt: now,
            acknowledgmentNote: note.trim() || 'Acknowledged by recipient.',
          }
        : h
    ),
    lastUpdated: now,
  };
}

export function calculateDashboardMetrics(state: AppDatabaseState): DashboardMetrics {
  const totalMeetings = state.meetings.length;
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = state.tasks.filter((t) => t.status === 'overdue').length;
  const pendingTasks = state.tasks.filter((t) => t.status === 'pending').length;
  const openTasks = pendingTasks + overdueTasks;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalMeetings,
    totalTasks,
    openTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    completionRate,
    totalDecisions: state.decisions.length,
    activeBlockers: state.blockers.filter((b) => b.status === 'Active').length,
    carriedForwardCount: state.carryForwardHistory.length,
    acknowledgedHandovers: state.handovers.filter((h) => h.status === 'Acknowledged').length,
    totalHandovers: state.handovers.length,
  };
}

export function calculateWeeklyReport(state: AppDatabaseState): WeeklyReportData {
  const metrics = calculateDashboardMetrics(state);
  const ownerMap = new Map<
    string,
    { completed: number; pending: number; overdue: number; total: number }
  >();

  for (const task of state.tasks) {
    const owner = task.owner || 'Unassigned';
    const current = ownerMap.get(owner) || {
      completed: 0,
      pending: 0,
      overdue: 0,
      total: 0,
    };
    current.total += 1;
    if (task.status === 'completed') current.completed += 1;
    else if (task.status === 'overdue') current.overdue += 1;
    else current.pending += 1;
    ownerMap.set(owner, current);
  }

  const byOwner = Array.from(ownerMap.entries()).map(([owner, counts]) => ({
    owner,
    ...counts,
    completionRate: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
  }));

  const defaultNarrative = `Executive Summary (${state.scenarioName}): Across ${metrics.totalMeetings} recorded meetings, the team is tracking ${metrics.totalTasks} total action items with a ${metrics.completionRate}% completion rate (${metrics.completedTasks} completed, ${metrics.pendingTasks} pending, and ${metrics.overdueTasks} overdue). ${metrics.totalDecisions} formal decisions have been locked in, and ${metrics.carriedForwardCount} unfinished task(s) have been carried forward across meetings to preserve accountability. ${metrics.activeBlockers} active blocker(s) require leadership attention.`;

  return {
    generatedAt: new Date().toISOString(),
    referenceDate: state.referenceDate,
    metrics,
    byOwner,
    overdueItems: state.tasks.filter((t) => t.status === 'overdue'),
    recentDecisions: state.decisions,
    activeBlockers: state.blockers.filter((b) => b.status === 'Active'),
    carryForwardSummary: state.carryForwardHistory,
    weeklyTrend: [
      { weekLabel: 'Oct 12', completed: 3, opened: 4, overdue: 0 },
      { weekLabel: 'Oct 19', completed: 4, opened: 5, overdue: 1 },
      { weekLabel: 'Oct 26', completed: 2, opened: 4, overdue: 1 },
      {
        weekLabel: 'Nov 02 (Current)',
        completed: metrics.completedTasks,
        opened: metrics.openTasks,
        overdue: metrics.overdueTasks,
      },
    ],
    aiExecutiveNarrative: state.savedReportNarrative || defaultNarrative,
  };
}

export function resetToDemoState(): AppDatabaseState {
  return createInitialSeedState();
}
