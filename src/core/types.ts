export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type IngestionInputType = 'manual' | 'txt' | 'csv' | 'json' | 'transcript-analysis';

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
  dependencies?: string[];
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

export interface IngestionMetadata {
  inputType: IngestionInputType;
  ingestedAt: string;
  validationStatus: 'Valid' | 'Warning' | 'Failed';
  validationNotes: string[];
  sourceFormat?: string;
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
  keyDiscussionPoints?: string[];
  dependencies?: string[];
  openIssues?: string[];
  followUpRequirements?: string[];
  nextSteps?: string[];
  aiAnalyzedAt?: string;
  carriedTaskIds: string[];
  ingestionMetadata?: IngestionMetadata;
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
  dependencies?: string[];
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
  keyDiscussionPoints?: string[];
  decisions: AIExtractedDecisionDraft[];
  actionItems: AIExtractedTaskDraft[];
  blockers: AIExtractedBlockerDraft[];
  dependencies?: string[];
  openIssues?: string[];
  followUpRequirements?: string[];
  nextSteps: string[];
  validationWarnings?: string[];
  sourceEngine: 'gemini' | 'deterministic-fallback';
  analyzedAt: string;
}

export interface ProcessingLogEntry {
  id: string;
  meetingId: string;
  meetingTitle: string;
  timestamp: string;
  inputType: IngestionInputType;
  extractionStatus: 'Completed' | 'Ingested (Pending Extraction)' | 'Review Required' | 'Failed';
  sourceEngine: 'gemini' | 'deterministic-fallback' | 'ingestion-validator';
  decisionsExtracted: number;
  actionItemsExtracted: number;
  validationStatus: 'Valid' | 'Warning' | 'Failed';
  errors: string[];
  warnings: string[];
}

export interface DataQualityIssue {
  id: string;
  category:
    | 'Required Field'
    | 'Duplicate Detection'
    | 'Date Format'
    | 'Owner Validation'
    | 'Relationship Integrity'
    | 'AI Output Validation';
  severity: 'Warning' | 'Error';
  entityType: 'Meeting' | 'ActionItem' | 'Decision' | 'FollowUp';
  entityId: string;
  entityTitle: string;
  message: string;
}

export interface DataQualityReport {
  evaluatedAt: string;
  overallStatus: 'Healthy' | 'Attention Needed' | 'Critical Issues';
  totalRecordsChecked: number;
  validRecordsCount: number;
  warningCount: number;
  errorCount: number;
  duplicateActionItemsDetected: number;
  unassignedTasksCount: number;
  unspecifiedDatesCount: number;
  orphanedRelationshipsCount: number;
  issues: DataQualityIssue[];
}

export interface DashboardMetrics {
  totalMeetings: number;
  totalTasks: number;
  openTasks: number; // pending + in-progress + overdue
  pendingTasks: number;
  inProgressTasks?: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number; // 0-100 integer
  followUpCompletionRate?: number; // 0-100 integer
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
    inProgress?: number;
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
  processingHistory?: ProcessingLogEntry[];
  savedReportNarrative?: string;
  lastUpdated: string;
}
