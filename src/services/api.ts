import {
  acknowledgeHandover,
  approveAIAnalysisToMeeting,
  carryForwardTask,
  createHandover,
  createMeeting,
  createTask,
  deleteMeeting,
  deleteTask,
  executeCopilotTurn,
  extractMeetingDeterministic,
  ingestMeetingData,
  resetToDemoState,
  updateMeeting,
  updateTask,
  updateTaskStatus,
  CopilotTurnResponse,
} from '../core/engine';
import { createInitialSeedState } from '../core/seedData';
import { AIAnalysisResult, AppDatabaseState, TaskPriority, TaskStatus } from '../core/types';

const LOCAL_STORAGE_KEY = 'syncmind_creditvision_sopan_state_v4';

function saveLocalMirror(state: AppDatabaseState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function loadLocalMirror(): AppDatabaseState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppDatabaseState;
      if (
        parsed &&
        Array.isArray(parsed.meetings) &&
        Array.isArray(parsed.tasks) &&
        Array.isArray(parsed.participants) &&
        parsed.participants.some((p) => p.name === 'Sopan Shinde')
      ) {
        if (!Array.isArray(parsed.processingHistory)) {
          parsed.processingHistory = createInitialSeedState().processingHistory;
        }
        return parsed;
      }
    }
  } catch {
    // ignore parse errors
  }
  const seed = createInitialSeedState();
  saveLocalMirror(seed);
  return seed;
}

export async function fetchAppState(): Promise<AppDatabaseState> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Server state fetch failed');
    const data = (await res.json()) as AppDatabaseState;
    saveLocalMirror(data);
    return data;
  } catch {
    return loadLocalMirror();
  }
}

export async function apiResetDemoData(): Promise<AppDatabaseState> {
  try {
    const res = await fetch('/api/state/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Reset failed');
    const data = (await res.json()) as AppDatabaseState;
    saveLocalMirror(data);
    return data;
  } catch {
    const reset = resetToDemoState();
    saveLocalMirror(reset);
    return reset;
  }
}

export async function apiCreateMeeting(payload: {
  title: string;
  date: string;
  startTime?: string;
  durationMinutes?: number;
  participants: string[];
  agenda: string;
  notes?: string;
  transcript?: string;
}): Promise<AppDatabaseState> {
  const res = await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create meeting' }));
    if (err.state) {
      saveLocalMirror(err.state);
    }
    throw new Error(err.error || 'Failed to create meeting');
  }
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiIngestMeetingData(payload: {
  format: 'txt' | 'csv' | 'json';
  rawContent: string;
  autoExtract?: boolean;
}): Promise<AppDatabaseState> {
  const res = await fetch('/api/meetings/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to ingest meeting data' }));
    if (err.state) {
      saveLocalMirror(err.state);
    }
    throw new Error(err.error || 'Failed to ingest meeting data');
  }
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiUpdateMeeting(
  id: string,
  updates: Partial<{
    title: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    participants: string[];
    agenda: string;
    notes: string;
    transcript: string;
  }>
): Promise<AppDatabaseState> {
  const res = await fetch(`/api/meetings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update meeting' }));
    throw new Error(err.error || 'Failed to update meeting');
  }
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiDeleteMeeting(id: string): Promise<AppDatabaseState> {
  const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete meeting');
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiAnalyzeMeeting(payload: {
  title?: string;
  transcript: string;
  notes?: string;
  fastMode?: boolean;
}): Promise<AIAnalysisResult> {
  try {
    const res = await fetch('/api/ai/analyze-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Analysis request failed' }));
      throw new Error(err.error || 'Analysis request failed');
    }
    return (await res.json()) as AIAnalysisResult;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Please provide a meeting transcript')) {
      throw err;
    }
    return extractMeetingDeterministic(payload.transcript, payload.notes || '');
  }
}

export async function apiApproveAnalysis(
  meetingId: string,
  analysis: AIAnalysisResult
): Promise<AppDatabaseState> {
  try {
    const res = await fetch(`/api/meetings/${meetingId}/approve-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysis),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save analysis' }));
      throw new Error(err.error || 'Failed to save analysis');
    }
    const data = (await res.json()) as AppDatabaseState;
    saveLocalMirror(data);
    return data;
  } catch {
    const next = approveAIAnalysisToMeeting(loadLocalMirror(), meetingId, analysis);
    saveLocalMirror(next);
    return next;
  }
}

export async function apiCreateTask(payload: {
  title: string;
  description?: string;
  owner?: string;
  priority?: TaskPriority;
  deadline?: string;
  dependencies?: string[];
  sourceMeetingId: string;
}): Promise<AppDatabaseState> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create task' }));
    throw new Error(err.error || 'Failed to create task');
  }
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiUpdateTask(
  taskId: string,
  updates: Partial<{
    title: string;
    description: string;
    owner: string;
    priority: TaskPriority;
    deadline: string;
    status: TaskStatus;
    dependencies: string[];
  }>
): Promise<AppDatabaseState> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update task' }));
    throw new Error(err.error || 'Failed to update task');
  }
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiUpdateTaskStatus(
  taskId: string,
  status: TaskStatus,
  note?: string
): Promise<AppDatabaseState> {
  try {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) throw new Error('Failed to update task status');
    const data = (await res.json()) as AppDatabaseState;
    saveLocalMirror(data);
    return data;
  } catch {
    const next = updateTaskStatus(loadLocalMirror(), taskId, status, note);
    saveLocalMirror(next);
    return next;
  }
}

export async function apiDeleteTask(taskId: string): Promise<AppDatabaseState> {
  const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiCarryForwardTask(
  taskId: string,
  targetMeetingId: string,
  reason?: string
): Promise<AppDatabaseState> {
  const res = await fetch(`/api/tasks/${taskId}/carry-forward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetMeetingId, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Carry-forward failed' }));
    throw new Error(err.error || 'Carry-forward failed');
  }
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiCreateHandover(payload: {
  title: string;
  projectContext: string;
  fromPerson: string;
  toPerson: string;
  completedWork: string[];
  pendingTasks: string[];
  blockers: string[];
  decisions: string[];
  nextSteps: string[];
}): Promise<AppDatabaseState> {
  const res = await fetch('/api/handovers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create handover' }));
    throw new Error(err.error || 'Failed to create handover');
  }
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiAcknowledgeHandover(
  handoverId: string,
  note?: string
): Promise<AppDatabaseState> {
  const res = await fetch(`/api/handovers/${handoverId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to acknowledge handover' }));
    throw new Error(err.error || 'Failed to acknowledge handover');
  }
  const data = (await res.json()) as AppDatabaseState;
  saveLocalMirror(data);
  return data;
}

export async function apiGenerateExecutiveReport(fastMode?: boolean): Promise<{
  narrative: string;
  sourceEngine: string;
  state: AppDatabaseState;
}> {
  const res = await fetch('/api/ai/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fastMode }),
  });
  if (!res.ok) throw new Error('Failed to generate AI executive report');
  const data = (await res.json()) as {
    narrative: string;
    sourceEngine: string;
    state: AppDatabaseState;
  };
  saveLocalMirror(data.state);
  return data;
}

export async function apiSendCopilotMessage(message: string): Promise<CopilotTurnResponse> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Copilot request failed');
    const data = (await res.json()) as CopilotTurnResponse;
    saveLocalMirror(data.state);
    return data;
  } catch {
    const fallback = executeCopilotTurn(loadLocalMirror(), message);
    saveLocalMirror(fallback.state);
    return fallback;
  }
}

export {
  createMeeting,
  ingestMeetingData,
  updateMeeting,
  deleteMeeting,
  createTask,
  updateTask,
  deleteTask,
  carryForwardTask,
  createHandover,
  acknowledgeHandover,
};
