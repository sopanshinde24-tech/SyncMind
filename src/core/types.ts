export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Participant {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatarUrl: string;
  initials: string;
}

export interface StatusHistoryEntry {
  timestamp: string;
  fromStatus: TaskStatus | 'created' | 'carried-forward';
  toStatus: TaskStatus;
  note: string;
  meetingId?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  owner: string; // Name of owner or "Unassigned"
  priority: TaskPriority;
  deadline: string; // YYYY-MM-DD or "Unspecified"
  status: TaskStatus;
  sourceMeetingId: string;
  sourceMeetingTitle: string;
  currentMeetingId: string;
  currentMeetingTitle: string;
  carriedFromMeetingIds: string[];
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  completedAt?: string;
}

export interface Decision {
  id: string;
  meetingId: string;
  meetingTitle: string;
  summary: string;
  owner: string; // Decision maker or "Unspecified"
  date: string;
  impactArea: string;
}

export interface Blocker {
  id: string;
  meetingId: string;
  meetingTitle: string;
  description: string;
  owner: string; // Owner or "Unassigned"
  severity: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Resolved';
  reportedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  durationMinutes: number;
  participants: string[]; // Participant names
  agenda: string;
  notes: string;
  transcript: string;
  aiSummary?: string;
  nextSteps?: string[];
  aiAnalyzedAt?: string;
  carriedTaskIds: string[];
  createdAt: string;
}

export interface CarryForwardRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  originalMeetingId: string;
  originalMeetingTitle: string;
  fromMeetingId: string;
  fromMeetingTitle: string;
  toMeetingId: string;
  toMeetingTitle: string;
  owner: string;
  carriedAt: string;
  reason: string;
}

export interface HandoverRecord {
  id: string;
  title: string;
  projectContext: string;
  fromPerson: string;
  toPerson: string;
  createdAt: string;
  completedWork: string[];
  pendingTasks: string[];
  blockers: string[];
  decisions: string[];
  nextSteps: string[];
  status: 'Pending Acknowledgment' | 'Acknowledged';
  acknowledgedAt?: string;
  acknowledgmentNote?: string;
}

export interface AIExtractedTaskDraft {
  title: string;
  description: string;
  owner: string;
  priority: TaskPriority;
  deadline: string;
}

export interface AIExtractedDecisionDraft {
  summary: string;
  owner: string;
  impactArea: string;
}

export interface AIExtractedBlockerDraft {
  description: string;
  owner: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface AIAnalysisResult {
  summary: string;
  decisions: AIExtractedDecisionDraft[];
  actionItems: AIExtractedTaskDraft[];
  blockers: AIExtractedBlockerDraft[];
  nextSteps: string[];
  sourceEngine: 'gemini' | 'deterministic-fallback';
  analyzedAt: string;
}

export interface DashboardMetrics {
  totalMeetings: number;
  totalTasks: number;
  openTasks: number; // pending + overdue
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number; // 0-100 integer
  totalDecisions: number;
  activeBlockers: number;
  carriedForwardCount: number;
  acknowledgedHandovers: number;
  totalHandovers: number;
}

export interface WeeklyReportData {
  generatedAt: string;
  referenceDate: string;
  metrics: DashboardMetrics;
  byOwner: Array<{
    owner: string;
    completed: number;
    pending: number;
    overdue: number;
    total: number;
    completionRate: number;
  }>;
  overdueItems: ActionItem[];
  recentDecisions: Decision[];
  activeBlockers: Blocker[];
  carryForwardSummary: CarryForwardRecord[];
  weeklyTrend: Array<{
    weekLabel: string;
    completed: number;
    opened: number;
    overdue: number;
  }>;
  aiExecutiveNarrative?: string;
}

export interface AppDatabaseState {
  scenarioName: string;
  referenceDate: string; // e.g., "2026-11-02"
  participants: Participant[];
  meetings: Meeting[];
  tasks: ActionItem[];
  decisions: Decision[];
  blockers: Blocker[];
  carryForwardHistory: CarryForwardRecord[];
  handovers: HandoverRecord[];
  savedReportNarrative?: string;
  lastUpdated: string;
}
