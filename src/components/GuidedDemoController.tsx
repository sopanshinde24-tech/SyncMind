import React from 'react';
import {
  CheckCircle2,
  FastForward,
  Globe,
  Loader2,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

export interface GuidedStepInfo {
  stepNumber: number;
  title: string;
  description: string;
}

export const GUIDED_DEMO_STEPS: GuidedStepInfo[] = [
  {
    stepNumber: 1,
    title: '1. Open Sample Meeting',
    description:
      'Opening "Q4 Business Operations Review — Part 2: Enterprise Rollout & Handover Sync" in Meeting Management.',
  },
  {
    stepNumber: 2,
    title: '2. Inspect Transcript & Context',
    description:
      'Viewing the verbatim multi-speaker transcript and business context for Elena Rostova, Marcus Vance, and Priya Nair.',
  },
  {
    stepNumber: 3,
    title: '3. Run AI Meeting Analysis',
    description:
      'Calling the AI Meeting Assistant to extract structured summary, decisions, action items, owners, deadlines, and blockers.',
  },
  {
    stepNumber: 4,
    title: '4. Display Generated Output',
    description:
      'Displaying extracted summary, 2 new decisions, 3 action items (including an Unassigned/Unspecified item), and 1 blocker.',
  },
  {
    stepNumber: 5,
    title: '5. Human Review & Approval Step',
    description:
      'Verifying source-grounded accuracy in the Human Review panel before committing records to the database.',
  },
  {
    stepNumber: 6,
    title: '6. Save Approved Action Items',
    description:
      'Saving the approved AI summary, decisions, blockers, and extracted action items into persistent storage.',
  },
  {
    stepNumber: 7,
    title: '7. Complete One Task',
    description:
      'Marking "Publish onboarding runbook for EMEA enterprise support escalation" (Priya Nair) as Completed.',
  },
  {
    stepNumber: 8,
    title: '8. Carry Unfinished Task Forward',
    description:
      'Carrying overdue task "Migrate legacy Stripe webhook queue to dead-letter retry worker" from Part 1 into Part 2 while preserving original source.',
  },
  {
    stepNumber: 9,
    title: '9. Open Weekly Report & Updated Figures',
    description:
      'Synthesizing the updated Weekly Operations Report reflecting newly approved tasks, completed work, and carried-forward lineage.',
  },
];

interface GuidedDemoControllerProps {
  scenarioName: string;
  activeStep: number | null; // 1..9 or null
  isRunningAuto: boolean;
  demoCompleted: boolean;
  onStartGuidedDemo: () => void;
  onNextStep: () => void;
  onFastForwardAll: () => void;
  onResetDemoData: () => void;
  onExploreManually: () => void;
  onOpenDeployGuide?: () => void;
}

export const GuidedDemoController: React.FC<GuidedDemoControllerProps> = ({
  scenarioName,
  activeStep,
  isRunningAuto,
  demoCompleted,
  onStartGuidedDemo,
  onNextStep,
  onFastForwardAll,
  onResetDemoData,
  onExploreManually,
  onOpenDeployGuide,
}) => {
  const currentStepInfo = activeStep
    ? GUIDED_DEMO_STEPS.find((s) => s.stepNumber === activeStep)
    : null;

  return (
    <div
      className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5"
      data-testid="recruiter-demo-bar"
    >
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Scenario Identity & Current Step Status */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-white">{scenarioName}</span>
            <span aria-hidden="true">·</span>
            <span>3 Participants</span>
            <span aria-hidden="true">·</span>
            <span>Interactive Product Demo</span>
          </div>

          {currentStepInfo ? (
            <div
              className="flex items-center gap-2 text-xs text-blue-300 font-medium"
              data-testid="guided-demo-active-step"
            >
              {isRunningAuto ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span>
                Step {currentStepInfo.stepNumber} of 9 — {currentStepInfo.title}:{' '}
                <span className="text-slate-200 font-normal">{currentStepInfo.description}</span>
              </span>
            </div>
          ) : demoCompleted ? (
            <div
              className="flex items-center gap-2 text-xs text-emerald-300 font-medium"
              data-testid="guided-demo-completed-banner"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Guided Demo Completed (Steps 1–9 executed on live state). Review the updated Weekly
                Report below or click Reset Demo Data.
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Click <strong className="text-white">Start Guided Demo</strong> to automatically walk
              through transcript analysis, human review, task completion, carry-forward, and
              reporting.
            </p>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {activeStep === null ? (
            <button
              type="button"
              onClick={onStartGuidedDemo}
              data-testid="start-guided-demo-btn"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Guided Demo
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onNextStep}
                data-testid="next-demo-step-btn"
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Next Step ({activeStep}/9)
              </button>
              <button
                type="button"
                onClick={onFastForwardAll}
                data-testid="complete-demo-now-btn"
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <FastForward className="w-3.5 h-3.5" />
                Complete All 9 Steps
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onResetDemoData}
            data-testid="reset-demo-data-btn"
            className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>

          <button
            type="button"
            onClick={onExploreManually}
            data-testid="explore-manually-btn"
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-transparent hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Explore Manually
          </button>

          {onOpenDeployGuide && (
            <button
              type="button"
              onClick={onOpenDeployGuide}
              data-testid="open-deploy-guide-btn"
              className="px-3 py-2 text-xs font-medium text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/70 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              Deploy Free
            </button>
          )}
        </div>
      </div>

      {/* 9-Step Progress Indicator Bar when demo is active or completed */}
      {(activeStep !== null || demoCompleted) && (
        <div className="max-w-[1400px] mx-auto mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-3 sm:grid-cols-9 gap-1.5">
          {GUIDED_DEMO_STEPS.map((s) => {
            const isDone = demoCompleted || (activeStep !== null && s.stepNumber < activeStep);
            const isCurrent = activeStep === s.stepNumber;
            return (
              <div
                key={s.stepNumber}
                className={`px-2 py-1 rounded text-[11px] truncate font-mono tabular-nums ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-semibold'
                    : isDone
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : 'bg-slate-800/70 text-slate-400'
                }`}
                title={s.title}
              >
                {s.title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
