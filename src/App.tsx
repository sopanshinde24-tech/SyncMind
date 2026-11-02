import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Briefcase,
  Calendar,
  CheckSquare,
  CornerDownRight,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { calculateDashboardMetrics } from './core/engine';
import { createInitialSeedState } from './core/seedData';
import { AIAnalysisResult, AppDatabaseState, TaskPriority, TaskStatus } from './core/types';
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
  apiUpdateMeeting,
  apiUpdateTask,
  apiUpdateTaskStatus,
  fetchAppState,
} from './services/api';
import { AIAssistantView } from './components/AIAssistantView';
import { CarryForwardView } from './components/CarryForwardView';
import { DashboardView } from './components/DashboardView';
import { DeployGuideModal } from './components/DeployGuideModal';
import { GuidedDemoController } from './components/GuidedDemoController';
import { HandoverView } from './components/HandoverView';
import { MeetingsView } from './components/MeetingsView';
import { ProblemSolutionVideo } from './components/ProblemSolutionVideo';
import { ReportsView } from './components/ReportsView';
import { TasksView } from './components/TasksView';

type ActiveTab =
  | 'dashboard'
  | 'meetings'
  | 'ai-assistant'
  | 'tasks'
  | 'carry-forward'
  | 'handover'
  | 'reports';

export default function App() {
  const [appState, setAppState] = useState<AppDatabaseState>(() => createInitialSeedState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>('mtg-q4-ops-1');
  const [aiContextMeetingId, setAiContextMeetingId] = useState<string | null>('mtg-q4-ops-2');
  const [externalDraftAnalysis, setExternalDraftAnalysis] = useState<AIAnalysisResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);

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
        // 1. Open the sample meeting
        setSelectedMeetingId(sampleMeeting.id);
        setActiveTab('meetings');
      } else if (step === 2) {
        // 2. Show its transcript and business context
        setSelectedMeetingId(sampleMeeting.id);
        setActiveTab('meetings');
      } else if (step === 3) {
        // 3. Run the AI meeting analysis
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
        // 4. Display the generated summary, decisions, and action items
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
        // 5. Show the human review and approval step
        setActiveTab('ai-assistant');
      } else if (step === 6) {
        // 6. Save the approved action items
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
        // 7. Complete one task
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
        // 8. Carry an unfinished task into the next meeting
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
        // 9. Open the weekly report and show the updated figures
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

  // Automatic progression effect when `isRunningAuto` is true
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
    showToast('Reset to initial "Scenario: Q4 Business Operations Review" baseline data.');
  };

  const handleExploreManually = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunningAuto(false);
    setGuidedStep(null);
    showToast('Manual exploration active. Use the navigation bar to test any module.');
  };

  const metrics = calculateDashboardMetrics(appState);

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meetings', label: 'Meetings', icon: Calendar, count: appState.meetings.length },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'tasks', label: 'Action Items', icon: CheckSquare, count: appState.tasks.length },
    {
      id: 'carry-forward',
      label: 'Carry-Forward',
      icon: CornerDownRight,
      count: metrics.openTasks,
    },
    { id: 'handover', label: 'Work Handover', icon: Briefcase, count: appState.handovers.length },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Zone 1 Brand Wordmark — Zone 2 Navigation Links — Zone 3 Primary Action */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
          >
            SyncMind AI
          </a>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="flex items-center gap-5 overflow-x-auto py-1 text-sm font-medium text-slate-600"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  data-testid={`nav-${item.id}`}
                  className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span className="ml-1.5 text-xs font-mono tabular-nums text-slate-400">
                      ({item.count})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="hidden sm:flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ai-assistant')}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Analyze Transcript
            </button>
          </div>
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
        onOpenDeployGuide={() => setIsDeployModalOpen(true)}
      />

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 text-xs text-blue-900 font-medium">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-blue-700 hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <ProblemSolutionVideo onStartLiveDemo={handleStartGuidedDemo} />
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
            }}
          />
        )}

        {activeTab === 'handover' && (
          <HandoverView
            state={appState}
            onCreateHandover={async (payload) => {
              const updated = await apiCreateHandover(payload);
              setAppState(updated);
              showToast(`Published handover "${payload.title}".`);
            }}
            onAcknowledgeHandover={async (handoverId, note) => {
              const updated = await apiAcknowledgeHandover(handoverId, note);
              setAppState(updated);
              showToast('Handover acknowledged and logged.');
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
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SyncMind AI — Meeting &amp; Workflow Intelligence Platform · {appState.scenarioName}
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDeployModalOpen(true)}
              className="hover:text-slate-900 underline cursor-pointer font-medium text-blue-700"
            >
              Free Deployment Guide (Vercel / Render)
            </button>
            <button
              type="button"
              onClick={handleResetDemoData}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Reset Demo Baseline
            </button>
            <span>Interactive Live Product Demo</span>
          </div>
        </div>
      </footer>

      <DeployGuideModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />
    </div>
  );
}
