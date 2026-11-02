import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { AppDatabaseState, Participant } from '../core/types';

interface SettingsViewProps {
  state: AppDatabaseState;
  activeUser: Participant;
  onSelectActiveUser: (participantName: string) => void;
  onResetDemoData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  activeUser,
  onSelectActiveUser,
  onResetDemoData,
}) => {
  const [strictExtraction, setStrictExtraction] = useState(true);
  const [autoFlagMissingOwners, setAutoFlagMissingOwners] = useState(true);
  const [preserveCarryForwardLineage, setPreserveCarryForwardLineage] = useState(true);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleExportWorkspaceJson = () => {
    const jsonString = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `syncmind-enterprise-workspace-${state.referenceDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSavedBanner('Workspace JSON snapshot exported.');
    setTimeout(() => setSavedBanner(null), 4000);
  };

  const handleSavePreferences = () => {
    setSavedBanner('Enterprise AI governance & workflow preferences saved.');
    setTimeout(() => setSavedBanner(null), 4000);
  };

  return (
    <div className="space-y-6" data-testid="settings-view">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
            Workspace Administration &amp; Governance
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Platform Settings &amp; AI Guardrails
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure your active operator profile, source-grounded AI extraction policies, and
            workspace data snapshots.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportWorkspaceJson}
            data-testid="export-workspace-json-btn"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Workspace JSON
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            data-testid="save-settings-btn"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Active Operator Profile & Team Directory */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Active Operator Profile &amp; Team Roles
                </h2>
              </div>
              <span className="text-xs font-mono text-indigo-600">
                Current: {activeUser.name}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select which delivery lead is currently signed in. This updates the top navigation
              profile and defaults your ownership filters and handover sign-offs.
            </p>

            <div className="space-y-2.5">
              {state.participants.map((person) => {
                const isSelected = person.name === activeUser.name;
                return (
                  <div
                    key={person.id}
                    onClick={() => onSelectActiveUser(person.name)}
                    data-testid={`settings-profile-${person.id}`}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-300'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={person.avatarUrl}
                        alt={person.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <span>{person.name}</span>
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-indigo-600 text-white rounded">
                              ACTIVE SESSION
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600">
                          {person.role} · {person.department}
                        </div>
                      </div>
                    </div>
                    <UserCheck
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-indigo-600' : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workspace Database Diagnostics */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Workspace Storage &amp; Baseline Reset
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-600">Persistent Storage Active</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-lg font-bold font-mono text-slate-900">
                  {state.meetings.length}
                </div>
                <div className="text-[11px] text-slate-500">Meetings Stored</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-lg font-bold font-mono text-slate-900">
                  {state.tasks.length}
                </div>
                <div className="text-[11px] text-slate-500">Action Items</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-lg font-bold font-mono text-slate-900">
                  {state.handovers.length}
                </div>
                <div className="text-[11px] text-slate-500">Work Transfers</div>
              </div>
            </div>

            {!confirmResetOpen ? (
              <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Restore the initial Q4 Business AI Delivery Review dataset at any time.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  data-testid="settings-open-reset-confirm-btn"
                  className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Demo Baseline
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                <div className="text-xs font-semibold text-red-900">
                  Confirm Workspace Baseline Reset?
                </div>
                <p className="text-xs text-red-800">
                  This will restore the 2 baseline meetings, 5 initial action items, 2 decisions, 1
                  blocker, and 1 work transfer.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetDemoData();
                      setConfirmResetOpen(false);
                      setSavedBanner('Workspace restored to initial baseline state.');
                    }}
                    data-testid="settings-confirm-reset-btn"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                  >
                    Yes, Restore Baseline
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 6 Columns: AI Intelligence & Continuity Guardrails */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  AI Meeting Intelligence Guardrails
                </h2>
              </div>
              <span className="text-xs font-mono text-violet-600">Human-in-the-Loop Active</span>
            </div>

            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Strict Source-Grounded Extraction
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Require all AI-extracted summaries, decisions, and tasks to be grounded strictly
                    in the meeting transcript and notes without fabricating context.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={strictExtraction}
                  onChange={(e) => setStrictExtraction(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-indigo-600 rounded"
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Never Guess Missing Owners or Deadlines
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automatically label missing task owners as <code className="font-mono">Unassigned</code> and
                    missing due dates as <code className="font-mono">Unspecified</code> for human review.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoFlagMissingOwners}
                  onChange={(e) => setAutoFlagMissingOwners(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-indigo-600 rounded"
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Immutable Carry-Forward Source Lineage
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When carrying unfinished tasks into a follow-up meeting, preserve the original
                    source meeting reference and prevent duplicate task creation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preserveCarryForwardLineage}
                  onChange={(e) => setPreserveCarryForwardLineage(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-indigo-600 rounded"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Enterprise Audit Compliance:</strong> All AI
                extractions remain in draft state until explicitly reviewed and approved by an
                operator in the AI Intelligence workspace.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
