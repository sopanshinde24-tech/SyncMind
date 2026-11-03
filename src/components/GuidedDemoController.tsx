import React from 'react';
import {
  CheckCircle2,
  FastForward,
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
      'Opening "PwC India Business AI Review — Part 2: Production Rollout & Client Handover Sync" in Meeting Management.',
  },
  {
    stepNumber: 2,
    title: '2. Inspect Transcript & Context',
    description:
      'Viewing the verbatim multi-city transcript for Ananya Sharma (Gurugram), Rohan Deshmukh (Bengaluru), and Priya Nair (Mumbai).',
  },
  {
    stepNumber: 3,
    title: '3. Run AI Meeting Analysis',
    description:
      'Calling AI Intelligence to extract structured summary, Partner decisions, action items, owners, deadlines, and blockers.',
  },
  {
    stepNumber: 4,
    title: '4. Display Generated Output',
    description:
      'Displaying extracted summary, 2 new BFSI decisions, 3 action items (including an Unassigned/Unspecified FinOps item), and 1 RBI firewall blocker.',
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
      'Saving the approved AI summary, Partner decisions, blockers, and extracted action items into persistent storage.',
  },
  {
    stepNumber: 7,
    title: '7. Complete One Task',
    description:
      'Marking "Publish Responsible AI & DPDP compliance runbook for BFSI client rollout" (Priya Nair, Mumbai) as Completed.',
  },
  {
    stepNumber: 8,
    title: '8. Carry Unfinished Task Forward',
    description:
      'Carrying overdue task "Migrate legacy LangChain ingestion queue to async dead-letter worker" (Rohan Deshmukh) from Part 1 into Part 2 while preserving original source.',
  },
  {
    stepNumber: 9,
    title: '9. Open Weekly Report & Updated Figures',
    description:
      'Synthesizing the updated Weekly Executive Report reflecting newly approved tasks, completed work, and carried-forward lineage.',
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
}) => {
  const currentStepInfo = activeStep
    ? GUIDED_DEMO_STEPS.find((s) => s.stepNumber === activeStep)
    : null;

  return (
    <div
      className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3"
      data-testid="recruiter-demo-bar"
    >
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Scenario Identity & Current Step Status */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-white">{scenarioName}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Ananya Sharma · Rohan Deshmukh · Priya Nair</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-indigo-400 font-medium">Enterprise Product Walkthrough</span>
          </div>

          {currentStepInfo ? (
            <div
              className="flex items-center gap-2 text-xs text-indigo-300 font-medium"
              data-testid="guided-demo-active-step"
            >
              {isRunningAuto ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
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
                Guided Walkthrough Completed (Steps 1–9 executed on live state). Review the updated
                Weekly Report below or click Reset Workspace Data.
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Click <strong className="text-white">Start Guided Walkthrough</strong> to
              automatically walk through transcript analysis, human review, task completion,
              carry-forward, and executive reporting.
            </p>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {activeStep === null ? (
            <button
              type="button"
              onClick={onStartGuidedDemo}
              data-testid="start-guided-demo-btn"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Guided Walkthrough
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onNextStep}
                data-testid="next-demo-step-btn"
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Next Step ({activeStep}/9)
              </button>
              <button
                type="button"
                onClick={onFastForwardAll}
                data-testid="complete-demo-now-btn"
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
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
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Workspace Data
          </button>

          <button
            type="button"
            onClick={onExploreManually}
            data-testid="explore-manually-btn"
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-transparent hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Explore Manually
          </button>
        </div>
      </div>

      {/* 9-Step Progress Indicator Bar when demo is active or completed */}
      {(activeStep !== null || demoCompleted) && (
        <div className="max-w-[1440px] mx-auto mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-3 sm:grid-cols-9 gap-1.5">
          {GUIDED_DEMO_STEPS.map((s) => {
            const isDone = demoCompleted || (activeStep !== null && s.stepNumber < activeStep);
            const isCurrent = activeStep === s.stepNumber;
            return (
              <div
                key={s.stepNumber}
                className={`px-2 py-1 rounded text-[11px] truncate font-mono tabular-nums ${
                  isCurrent
                    ? 'bg-indigo-600 text-white font-semibold'
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
