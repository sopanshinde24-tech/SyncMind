import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CheckSquare,
  CornerDownRight,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { calculateDashboardMetrics } from './core/engine';
import { createInitialSeedState } from './core/seedData';
import { AIAnalysisResult, AppDatabaseState, TaskStatus } from './core/types';
import {
  apiAcknowledgeHandover,
  apiAnalyzeMeeting,
  apiApproveAnalysis,
  apiCarryForwardTask,
  apiCreateHandover,
  apiCreateMeeting,
  apiCreateTask,
  apiDeleteMeeting,
  apiDeleteTask,
  apiGenerateExecutiveReport,
  apiResetDemoData,
  apiSendCopilotMessage,
  apiUpdateMeeting,
  apiUpdateTask,
  apiUpdateTaskStatus,
  fetchAppState,
} from './services/api';
import { AIAssistantView } from './components/AIAssistantView';
import { AICopilotChatbot } from './components/AICopilotChatbot';
import { CarryForwardView } from './components/CarryForwardView';
import { CommandSearchModal } from './components/CommandSearchModal';
import { DashboardView } from './components/DashboardView';
import { GuidedDemoController } from './components/GuidedDemoController';
import { HandoverView } from './components/HandoverView';
import { MeetingsView } from './components/MeetingsView';
import { ProblemSolutionVideo } from './components/ProblemSolutionVideo';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TasksView } from './components/TasksView';

type ActiveTab =
  | 'dashboard'
  | 'meetings'
  | 'ai-assistant'
  | 'tasks'
  | 'carry-forward'
  | 'handover'
  | 'reports'
  | 'settings';

export default function App() {
  const [appState, setAppState] = useState<AppDatabaseState>(() => createInitialSeedState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>('mtg-q4-ops-1');
  const [aiContextMeetingId, setAiContextMeetingId] = useState<string | null>('mtg-q4-ops-2');
  const [externalDraftAnalysis, setExternalDraftAnalysis] = useState<AIAnalysisResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Top Navigation & Enterprise Shell State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [activeUserName, setActiveUserName] = useState<string>('Ananya Sharma');

  // Guided Demo State
  const [guidedStep, setGuidedStep] = useState<number | null>(null);
  const [isRunningAuto, setIsRunningAuto] = useState<boolean>(false);
  const [demoCompleted, setDemoCompleted] = useState<boolean>(false);
  const demoAnalysisRef = useRef<AIAnalysisResult | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  useEffect(() => {
    fetchAppState().then((loaded) => {
      setAppState(loaded);
    });
  }, []);

  // Global Cmd+K / Ctrl+K shortcut for Command Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Execute a specific step (1..9) of the Guided Demo using real application functions & state updates
  const executeDemoStep = useCallback(
    async (
      step: number,
      currentState: AppDatabaseState,
      fastMode: boolean = false
    ): Promise<AppDatabaseState> => {
      let nextState = currentState;
      const sampleMeeting =
        nextState.meetings.find((m) => m.id === 'mtg-q4-ops-2') || nextState.meetings[0];

      if (step === 1) {
        setSelectedMeetingId(sampleMeeting.id);
        setActiveTab('meetings');
      } else if (step === 2) {
        setSelectedMeetingId(sampleMeeting.id);
        setActiveTab('meetings');
      } else if (step === 3) {
        setAiContextMeetingId(sampleMeeting.id);
        setActiveTab('ai-assistant');
        const analysis = await apiAnalyzeMeeting({
          title: sampleMeeting.title,
          transcript: sampleMeeting.transcript,
          notes: sampleMeeting.notes,
          fastMode,
        });
        demoAnalysisRef.current = analysis;
        setExternalDraftAnalysis(analysis);
      } else if (step === 4) {
        setActiveTab('ai-assistant');
        if (!demoAnalysisRef.current) {
          const analysis = await apiAnalyzeMeeting({
            title: sampleMeeting.title,
            transcript: sampleMeeting.transcript,
            notes: sampleMeeting.notes,
            fastMode,
          });
          demoAnalysisRef.current = analysis;
          setExternalDraftAnalysis(analysis);
        }
      } else if (step === 5) {
        setActiveTab('ai-assistant');
      } else if (step === 6) {
        setActiveTab('ai-assistant');
        const analysisToApprove =
          demoAnalysisRef.current ||
          (await apiAnalyzeMeeting({
            title: sampleMeeting.title,
            transcript: sampleMeeting.transcript,
            notes: sampleMeeting.notes,
            fastMode,
          }));
        nextState = await apiApproveAnalysis(sampleMeeting.id, analysisToApprove);
        setAppState(nextState);
      } else if (step === 7) {
        setActiveTab('tasks');
        const targetTask =
          nextState.tasks.find((t) => t.id === 'task-4' && t.status !== 'completed') ||
          nextState.tasks.find((t) => t.status === 'pending') ||
          nextState.tasks[0];
        if (targetTask && targetTask.status !== 'completed') {
          nextState = await apiUpdateTaskStatus(
            targetTask.id,
            'completed',
            'Completed during Guided Demo walkthrough.'
          );
          setAppState(nextState);
        }
      } else if (step === 8) {
        setActiveTab('carry-forward');
        const targetMtgId = sampleMeeting.id;
        const unfinishedFromPrev =
          nextState.tasks.find(
            (t) =>
              t.id === 'task-2' &&
              t.status !== 'completed' &&
              t.currentMeetingId !== targetMtgId
          ) ||
          nextState.tasks.find(
            (t) => t.status !== 'completed' && t.currentMeetingId !== targetMtgId
          );
        if (unfinishedFromPrev) {
          try {
            nextState = await apiCarryForwardTask(
              unfinishedFromPrev.id,
              targetMtgId,
              'Carried forward into Part 2 review during Guided Demo.'
            );
            setAppState(nextState);
          } catch {
            nextState = await fetchAppState();
            setAppState(nextState);
          }
        }
      } else if (step === 9) {
        setActiveTab('reports');
        try {
          const rep = await apiGenerateExecutiveReport(fastMode);
          nextState = rep.state;
          setAppState(nextState);
        } catch {
          // keep current state if report narrative call fails
        }
      }

      return nextState;
    },
    []
  );

  const appStateRef = useRef<AppDatabaseState>(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const demoRunIdRef = useRef<number>(0);
  const [stepInProgress, setStepInProgress] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunningAuto || guidedStep === null || stepInProgress) return;
    const activeRunId = demoRunIdRef.current;

    timerRef.current = window.setTimeout(async () => {
      if (demoRunIdRef.current !== activeRunId) return;
      if (guidedStep < 9) {
        const nextStepNum = guidedStep + 1;
        setStepInProgress(true);
        setGuidedStep(nextStepNum);
        try {
          const updated = await executeDemoStep(nextStepNum, appStateRef.current, false);
          if (demoRunIdRef.current === activeRunId) {
            appStateRef.current = updated;
          }
        } finally {
          if (demoRunIdRef.current === activeRunId) {
            setStepInProgress(false);
          }
        }
      } else {
        setIsRunningAuto(false);
        setGuidedStep(null);
        setDemoCompleted(true);
        showToast('Guided Demo completed! All 9 workflow steps executed on live application data.');
      }
    }, 900);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunningAuto, guidedStep, stepInProgress, executeDemoStep, showToast]);

  const handleStartGuidedDemo = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const runId = ++demoRunIdRef.current;
    setStepInProgress(true);
    try {
      const freshState = await apiResetDemoData();
      if (demoRunIdRef.current !== runId) return;
      setAppState(freshState);
      appStateRef.current = freshState;
      demoAnalysisRef.current = null;
      setExternalDraftAnalysis(null);
      setDemoCompleted(false);
      setGuidedStep(1);
      setIsRunningAuto(true);
      await executeDemoStep(1, freshState, false);
    } finally {
      if (demoRunIdRef.current === runId) {
        setStepInProgress(false);
      }
    }
  };

  const handleNextDemoStep = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const runId = ++demoRunIdRef.current;
    setIsRunningAuto(false);
    if (guidedStep === null) return;
    if (guidedStep < 9) {
      const nextStep = guidedStep + 1;
      setStepInProgress(true);
      setGuidedStep(nextStep);
      try {
        const updated = await executeDemoStep(nextStep, appStateRef.current, false);
        if (demoRunIdRef.current === runId) {
          appStateRef.current = updated;
        }
      } finally {
        if (demoRunIdRef.current === runId) {
          setStepInProgress(false);
        }
      }
    } else {
      setGuidedStep(null);
      setDemoCompleted(true);
    }
  };

  const handleFastForwardAll = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const runId = ++demoRunIdRef.current;
    setIsRunningAuto(false);
    setStepInProgress(true);
    try {
      const startFrom = guidedStep || 1;
      let workingState = appStateRef.current;
      for (let s = startFrom; s <= 9; s++) {
        if (demoRunIdRef.current !== runId) return;
        setGuidedStep(s);
        workingState = await executeDemoStep(s, workingState, true);
        appStateRef.current = workingState;
      }
      if (demoRunIdRef.current !== runId) return;
      setGuidedStep(null);
      setDemoCompleted(true);
      showToast('Guided Demo completed! All 9 workflow steps executed on live application data.');
    } finally {
      if (demoRunIdRef.current === runId) {
        setStepInProgress(false);
      }
    }
  };

  const handleResetDemoData = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    ++demoRunIdRef.current;
    setIsRunningAuto(false);
    setStepInProgress(false);
    setGuidedStep(null);
    setDemoCompleted(false);
    demoAnalysisRef.current = null;
    setExternalDraftAnalysis(null);
    const reset = await apiResetDemoData();
    setAppState(reset);
    appStateRef.current = reset;
    setSelectedMeetingId('mtg-q4-ops-1');
    setActiveTab('dashboard');
    showToast('Reset to initial "Scenario: PwC India — Q4 Business AI & GenAI Delivery Review" baseline.');
  };

  const handleExploreManually = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunningAuto(false);
    setGuidedStep(null);
    showToast('Manual exploration active. Use the left sidebar, Cmd+K search, or AI Copilot.');
  };

  const metrics = calculateDashboardMetrics(appState);

  const activeUser =
    appState.participants.find((p) => p.name === activeUserName) || appState.participants[0];

  const pendingTransfersCount = appState.handovers.filter(
    (h) => h.status === 'Pending Acknowledgment'
  ).length;
  const totalAlertsCount =
    metrics.overdueTasks + metrics.activeBlockers + pendingTransfersCount;

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'meetings', label: 'Meetings', icon: Calendar, count: appState.meetings.length },
    { id: 'ai-assistant', label: 'AI Intelligence', icon: Sparkles },
    { id: 'tasks', label: 'Action Items', icon: CheckSquare, count: appState.tasks.length },
    {
      id: 'handover',
      label: 'Work Transfers',
      icon: Briefcase,
      count: appState.handovers.length,
    },
    {
      id: 'carry-forward',
      label: 'Carry-Forward',
      icon: CornerDownRight,
      count: metrics.openTasks,
    },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Context-Sensitive Primary Action in Top Nav
  const renderContextPrimaryAction = () => {
    if (activeTab === 'meetings') {
      return (
        <button
          type="button"
          onClick={() => setActiveTab('ai-assistant')}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Analyze Transcript
        </button>
      );
    }
    if (activeTab === 'tasks') {
      return (
        <button
          type="button"
          onClick={() => setActiveTab('carry-forward')}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <CornerDownRight className="w-3.5 h-3.5" />
          Carry Forward Tasks
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setActiveTab('ai-assistant')}
        className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Analyze Transcript
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Persistent Left Sidebar (Desktop) */}
      <aside
        aria-label="Primary Workspace Sidebar"
        className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen justify-between"
      >
        <div>
          {/* Brand Identity */}
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
              className="flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 font-display"
            >
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
                SM
              </span>
              <span>
                SyncMind <span className="text-indigo-600">AI</span>
              </span>
            </a>
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              Enterprise
            </span>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Primary Navigation" className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  data-testid={`nav-${item.id}`}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-800 font-semibold'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Workspace Summary & Operator Card */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/50">
          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Completion Rate</span>
              <span className="font-mono font-semibold text-indigo-600">
                {metrics.completionRate}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${metrics.completionRate}%` }}
                className="h-full bg-indigo-600 rounded-full transition-all"
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {metrics.completedTasks}/{metrics.totalTasks} tasks · {metrics.overdueTasks} overdue
            </div>
          </div>

          {activeUser && (
            <div className="flex items-center gap-2.5 px-1">
              <img
                src={activeUser.avatarUrl}
                alt={activeUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-300"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {activeUser.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{activeUser.role}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden flex"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div
            className="w-64 bg-white h-full p-4 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-base font-bold text-slate-900">
                  SyncMind <span className="text-indigo-600">AI</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </span>
                      {item.count !== undefined && (
                        <span className="text-[11px] font-mono">{item.count}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Right Main Column: Top Navigation + Recruiter Demo Controller + Active Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Enterprise Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 sticky top-0 z-30 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Button + Current Workspace Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900 truncate">
                  PwC India · Business AI Practice
                </span>
                <span aria-hidden="true" className="text-slate-300 hidden sm:inline">
                  /
                </span>
                <span className="text-indigo-600 font-medium hidden sm:inline">
                  {navItems.find((i) => i.id === activeTab)?.label || 'Overview'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Reference Date: {appState.referenceDate} · Gurugram · Bengaluru · Mumbai
              </div>
            </div>
          </div>

          {/* Center/Right: Global Search (Cmd+K), Notifications, User Profile, Context Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Global Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              data-testid="open-command-search-btn"
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Search meetings, tasks, decisions...</span>
              <span className="md:hidden">Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-label="Open notifications"
                data-testid="open-notifications-btn"
                className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {totalAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {totalAlertsCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
                  data-testid="notifications-popover"
                >
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Operational Alerts ({totalAlertsCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {appState.tasks
                      .filter((t) => t.status === 'overdue')
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('tasks');
                            setIsNotificationsOpen(false);
                          }}
                          className="w-full p-3.5 text-left hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-900">{t.title}</div>
                            <div className="text-[11px] text-red-600 font-mono mt-0.5">
                              OVERDUE · Owner: {t.owner} · Due {t.deadline}
                            </div>
                          </div>
                        </button>
                      ))}
                    {appState.blockers.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedMeetingId(b.meetingId);
                          setActiveTab('meetings');
                          setIsNotificationsOpen(false);
                        }}
                        className="w-full p-3.5 text-left hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-900">{b.description}</div>
                          <div className="text-[11px] text-amber-700 font-mono mt-0.5">
                            ACTIVE BLOCKER · Owner: {b.owner}
                          </div>
                        </div>
                      </button>
                    ))}
                    {appState.handovers
                      .filter((h) => h.status === 'Pending Acknowledgment')
                      .map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('handover');
                            setIsNotificationsOpen(false);
                          }}
                          className="w-full p-3.5 text-left hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer"
                        >
                          <Briefcase className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-900">{h.title}</div>
                            <div className="text-[11px] text-indigo-600 font-mono mt-0.5">
                              PENDING TRANSFER · {h.fromPerson} &rarr; {h.toPerson}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Active Operator Selector (Desktop) */}
            <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200">
              {activeUser && (
                <img
                  src={activeUser.avatarUrl}
                  alt={activeUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-300"
                />
              )}
              <select
                aria-label="Active workspace operator"
                value={activeUserName}
                onChange={(e) => {
                  setActiveUserName(e.target.value);
                  showToast(`Switched active operator profile to ${e.target.value}.`);
                }}
                className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                {appState.participants.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Context-Sensitive Action */}
            <div className="hidden sm:block">{renderContextPrimaryAction()}</div>
          </div>
        </header>

        {/* Recruiter Scenario & Guided Demo Bar */}
        <GuidedDemoController
          scenarioName={appState.scenarioName}
          activeStep={guidedStep}
          isRunningAuto={isRunningAuto}
          demoCompleted={demoCompleted}
          onStartGuidedDemo={handleStartGuidedDemo}
          onNextStep={handleNextDemoStep}
          onFastForwardAll={handleFastForwardAll}
          onResetDemoData={handleResetDemoData}
          onExploreManually={handleExploreManually}
        />

        {/* Toast Feedback Banner */}
        {toastMessage && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-2.5 text-xs text-slate-900 font-medium">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-indigo-600 hover:underline ml-4 cursor-pointer font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <ProblemSolutionVideo
                onStartLiveDemo={handleStartGuidedDemo}
                onOpenCopilot={() => setIsCopilotOpen(true)}
              />
              <DashboardView
                state={appState}
                onNavigate={(tab, contextMtgId) => {
                  if (contextMtgId) {
                    setAiContextMeetingId(contextMtgId);
                    setSelectedMeetingId(contextMtgId);
                  }
                  setActiveTab(tab as ActiveTab);
                }}
                onToggleTaskStatus={async (taskId, nextStatus) => {
                  const updated = await apiUpdateTaskStatus(taskId, nextStatus);
                  setAppState(updated);
                  showToast(`Task status updated to ${nextStatus}.`);
                }}
                onOpenCopilot={() => setIsCopilotOpen(true)}
              />
            </div>
          )}

          {activeTab === 'meetings' && (
            <MeetingsView
              state={appState}
              selectedMeetingId={selectedMeetingId}
              onSelectMeeting={(id) => setSelectedMeetingId(id)}
              onCreateMeeting={async (payload) => {
                const updated = await apiCreateMeeting(payload);
                setAppState(updated);
                setSelectedMeetingId(updated.meetings[0]?.id || null);
                showToast(`Created meeting "${payload.title}".`);
              }}
              onUpdateMeeting={async (id, updates) => {
                const updated = await apiUpdateMeeting(id, updates);
                setAppState(updated);
                showToast('Meeting record updated.');
              }}
              onDeleteMeeting={async (id) => {
                const updated = await apiDeleteMeeting(id);
                setAppState(updated);
                setSelectedMeetingId(updated.meetings[0]?.id || null);
                showToast('Meeting deleted.');
              }}
              onOpenAIAssistant={(meetingId) => {
                setAiContextMeetingId(meetingId);
                setActiveTab('ai-assistant');
              }}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistantView
              state={appState}
              initialMeetingId={aiContextMeetingId}
              externalDraftAnalysis={externalDraftAnalysis}
              onRunAnalysis={async (payload) => {
                return await apiAnalyzeMeeting(payload);
              }}
              onApproveAndSave={async (meetingId, analysis) => {
                const updated = await apiApproveAnalysis(meetingId, analysis);
                setAppState(updated);
                showToast('Approved AI meeting intelligence saved to database.');
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              state={appState}
              onCreateTask={async (payload) => {
                const updated = await apiCreateTask(payload);
                setAppState(updated);
                showToast(`Created action item "${payload.title}".`);
              }}
              onUpdateTask={async (taskId, updates) => {
                const updated = await apiUpdateTask(taskId, updates);
                setAppState(updated);
                showToast('Action item updated.');
              }}
              onToggleTaskStatus={async (taskId, nextStatus: TaskStatus) => {
                const updated = await apiUpdateTaskStatus(taskId, nextStatus);
                setAppState(updated);
                showToast(`Task marked ${nextStatus}.`);
              }}
              onDeleteTask={async (taskId) => {
                const updated = await apiDeleteTask(taskId);
                setAppState(updated);
                showToast('Action item deleted.');
              }}
            />
          )}

          {activeTab === 'carry-forward' && (
            <CarryForwardView
              state={appState}
              onCarryForwardTask={async (taskId, targetMeetingId, reason) => {
                const updated = await apiCarryForwardTask(taskId, targetMeetingId, reason);
                setAppState(updated);
                showToast('Task carried forward with source lineage preserved.');
              }}
            />
          )}

          {activeTab === 'handover' && (
            <HandoverView
              state={appState}
              onCreateHandover={async (payload) => {
                const updated = await apiCreateHandover(payload);
                setAppState(updated);
                showToast(`Published work transfer "${payload.title}".`);
              }}
              onAcknowledgeHandover={async (handoverId, note) => {
                const updated = await apiAcknowledgeHandover(handoverId, note);
                setAppState(updated);
                showToast('Work transfer acknowledged and logged.');
              }}
              onCarryForwardTask={async (taskId, targetMeetingId, reason) => {
                const updated = await apiCarryForwardTask(taskId, targetMeetingId, reason);
                setAppState(updated);
                showToast('Task carried forward with source lineage preserved.');
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              state={appState}
              onGenerateAIReport={async () => {
                const res = await apiGenerateExecutiveReport();
                setAppState(res.state);
                showToast('Executive report narrative updated from stored data.');
              }}
            />
          )}

          {activeTab === 'settings' && activeUser && (
            <SettingsView
              state={appState}
              activeUser={activeUser}
              onSelectActiveUser={(name) => {
                setActiveUserName(name);
                showToast(`Active operator profile set to ${name}.`);
              }}
              onResetDemoData={handleResetDemoData}
            />
          )}
        </main>

        {/* Quiet Enterprise Footer */}
        <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              SyncMind AI — Enterprise Meeting Intelligence &amp; Work Continuity ·{' '}
              {appState.scenarioName}
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsCopilotOpen(true)}
                className="hover:text-slate-900 underline cursor-pointer font-semibold text-indigo-600"
              >
                Launch AI Copilot
              </button>
              <button
                type="button"
                onClick={handleResetDemoData}
                className="hover:text-slate-900 underline cursor-pointer"
              >
                Reset Demo Baseline
              </button>
              <span>Enterprise Workspace</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Command Search Modal (Cmd+K) */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        state={appState}
        onSelectMeeting={(mtgId) => {
          setSelectedMeetingId(mtgId);
          setActiveTab('meetings');
        }}
        onSelectTask={() => {
          setActiveTab('tasks');
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Interactive AI Copilot Chatbot */}
      <AICopilotChatbot
        state={appState}
        isOpen={isCopilotOpen}
        onToggleOpen={() => setIsCopilotOpen((prev) => !prev)}
        onSendMessage={async (message) => {
          const response = await apiSendCopilotMessage(message);
          setAppState(response.state);
          appStateRef.current = response.state;
          if (response.executedAction) {
            showToast(response.executedAction);
          }
          return response;
        }}
      />
    </div>
  );
}
