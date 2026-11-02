import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acknowledgeHandover,
  approveAIAnalysisToMeeting,
  calculateDashboardMetrics,
  calculateWeeklyReport,
  carryForwardTask,
  createMeeting,
  createTask,
  executeCopilotTurn,
  extractMeetingDeterministic,
  resetToDemoState,
  updateMeeting,
  updateTaskStatus,
  validateAIAnalysisOutput,
} from './engine';
import { createInitialSeedState } from './seedData';

test('1. Initial Demo Seed State matches PwC India Q4 Business AI Review specification', () => {
  const state = createInitialSeedState();
  assert.equal(
    state.scenarioName,
    'Scenario: PwC India — Q4 Business AI & GenAI Delivery Review'
  );
  assert.equal(state.participants.length, 3);
  assert.equal(state.participants[0].name, 'Ananya Sharma');
  assert.equal(state.participants[1].name, 'Rohan Deshmukh');
  assert.equal(state.participants[2].name, 'Priya Nair');
  assert.equal(state.meetings.length, 2);
  assert.equal(state.tasks.length, 5);

  const metrics = calculateDashboardMetrics(state);
  assert.equal(metrics.completedTasks, 1);
  assert.equal(metrics.pendingTasks, 2);
  assert.equal(metrics.overdueTasks, 2);
  assert.equal(metrics.totalDecisions, 2);
  assert.equal(metrics.activeBlockers, 1);
  assert.equal(metrics.totalHandovers, 1);
});

test('2. Meeting creation and editing validation & state persistence', () => {
  let state = createInitialSeedState();
  state = createMeeting(state, {
    title: 'PwC India BFSI Security & DPDP Audit Sync',
    date: '2026-11-04',
    participants: ['Ananya Sharma', 'Rohan Deshmukh'],
    agenda: 'Review RBI cloud firewall rules and ISO 42001 sign-off status',
    notes: 'Initial security alignment across Gurugram and Bengaluru',
  });
  assert.equal(state.meetings.length, 3);
  const createdId = state.meetings[0].id;

  state = updateMeeting(state, createdId, {
    title: 'PwC India BFSI Security & DPDP Partner Sync',
    notes: 'Updated notes with auditor timeline',
  });
  assert.equal(state.meetings[0].title, 'PwC India BFSI Security & DPDP Partner Sync');
  assert.equal(state.meetings[0].notes, 'Updated notes with auditor timeline');
});

test('3. AI output validation enforces Unassigned / Unspecified for missing owners and dates', () => {
  const rawAIOutput = {
    summary: 'Reviewed RAG vector latency and FinOps costs.',
    decisions: [{ summary: 'Launch top 15 Indian BFSI accounts on Nov 10', owner: '' }],
    actionItems: [
      {
        title: 'Compile consolidated Q4 Partner steering deck token FinOps cost forecast',
        description: 'Prepare cost forecast',
        owner: 'unknown',
        priority: 'High',
        deadline: 'TBD',
      },
      {
        title: 'Deploy hallucination & token latency telemetry webhook',
        description: 'Deploy to #pwc-ai-ops',
        owner: 'Rohan Deshmukh',
        priority: 'High',
        deadline: '2026-11-04',
      },
    ],
    blockers: [{ description: 'RBI firewall IP whitelisting pending', owner: null, severity: 'High' }],
    nextSteps: ['Follow up with Mumbai bank infosec team'],
  };

  const validated = validateAIAnalysisOutput(rawAIOutput);
  assert.equal(validated.decisions[0].owner, 'Unspecified');
  assert.equal(validated.actionItems[0].owner, 'Unassigned');
  assert.equal(validated.actionItems[0].deadline, 'Unspecified');
  assert.equal(validated.actionItems[1].owner, 'Rohan Deshmukh');
  assert.equal(validated.actionItems[1].deadline, '2026-11-04');
  assert.equal(validated.blockers[0].owner, 'Unassigned');

  // Also test deterministic transcript extraction on Meeting 2
  const state = createInitialSeedState();
  const extracted = extractMeetingDeterministic(state.meetings[1].transcript);
  assert.ok(extracted.decisions.length >= 2);
  assert.ok(extracted.actionItems.length >= 3);
  const unassignedTask = extracted.actionItems.find((a) => a.owner === 'Unassigned');
  assert.ok(unassignedTask, 'Should mark task without owner in transcript as Unassigned');
  assert.equal(unassignedTask?.deadline, 'Unspecified');
});

test('4. Task creation and status changes update metrics and statusHistory', () => {
  let state = createInitialSeedState();
  state = createTask(state, {
    title: 'Verify Mumbai vector snapshot AES-256 encryption',
    owner: 'Rohan Deshmukh',
    priority: 'High',
    deadline: '2026-11-06',
    sourceMeetingId: 'mtg-q4-ops-2',
  });
  assert.equal(state.tasks.length, 6);
  const newTask = state.tasks[0];
  assert.equal(newTask.status, 'pending');

  state = updateTaskStatus(state, newTask.id, 'completed', 'Verified AES-256 snapshot keys.');
  const updated = state.tasks.find((t) => t.id === newTask.id)!;
  assert.equal(updated.status, 'completed');
  assert.ok(updated.completedAt);
  assert.equal(updated.statusHistory.length, 2);
});

test('5. Carry-forward logic preserves original source meeting and prevents duplicates', () => {
  let state = createInitialSeedState();
  // Carry task-2 (overdue from mtg-q4-ops-1) into mtg-q4-ops-2
  state = carryForwardTask(
    state,
    'task-2',
    'mtg-q4-ops-2',
    'Upstream connector patch delayed completion; carrying into Part 2 sprint.'
  );

  const carriedTask = state.tasks.find((t) => t.id === 'task-2')!;
  assert.equal(carriedTask.sourceMeetingId, 'mtg-q4-ops-1');
  assert.equal(carriedTask.currentMeetingId, 'mtg-q4-ops-2');
  assert.ok(carriedTask.carriedFromMeetingIds.includes('mtg-q4-ops-1'));
  assert.equal(state.carryForwardHistory.length, 1);

  // Attempting duplicate carry-forward into the same meeting must throw
  assert.throws(() => {
    carryForwardTask(state, 'task-2', 'mtg-q4-ops-2');
  }, /already been carried/);
});

test('6. Report calculations, Handover acknowledgment, and AI Copilot actions work accurately', () => {
  let state = createInitialSeedState();
  const analysis = extractMeetingDeterministic(state.meetings[1].transcript);
  state = approveAIAnalysisToMeeting(state, 'mtg-q4-ops-2', analysis);

  // Test AI Copilot completing Priya's task
  const copilotComplete = executeCopilotTurn(
    state,
    "Mark Priya Nair's compliance runbook task complete"
  );
  assert.ok(copilotComplete.executedAction?.includes('Completed Task'));
  state = copilotComplete.state;

  // Test AI Copilot carrying forward Rohan's overdue task
  const copilotCarry = executeCopilotTurn(
    state,
    "Carry forward Rohan's overdue LangChain task into Part 2"
  );
  assert.ok(copilotCarry.executedAction?.includes('Carried Forward'));
  state = copilotCarry.state;

  state = acknowledgeHandover(state, 'hnd-1', 'Acknowledged by Priya Nair in Mumbai.');

  const report = calculateWeeklyReport(state);
  assert.equal(report.metrics.completedTasks, 2);
  assert.equal(report.metrics.carriedForwardCount, 1);
  assert.equal(report.metrics.acknowledgedHandovers, 1);
  assert.ok(report.byOwner.length >= 3);
});

test('7. Persistence serialization and Demo Reset restore exact initial baseline', () => {
  let state = createInitialSeedState();
  state = updateTaskStatus(state, 'task-4', 'completed');
  const serialized = JSON.stringify(state);
  const restored = JSON.parse(serialized);
  assert.equal(calculateDashboardMetrics(restored).completedTasks, 2);

  const resetState = resetToDemoState();
  const resetMetrics = calculateDashboardMetrics(resetState);
  assert.equal(resetMetrics.completedTasks, 1);
  assert.equal(resetMetrics.pendingTasks, 2);
  assert.equal(resetMetrics.overdueTasks, 2);
  assert.equal(resetMetrics.totalTasks, 5);
});
