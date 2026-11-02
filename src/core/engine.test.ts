import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acknowledgeHandover,
  approveAIAnalysisToMeeting,
  calculateDashboardMetrics,
  calculateWeeklyReport,
  carryForwardTask,
  createHandover,
  createMeeting,
  createTask,
  extractMeetingDeterministic,
  resetToDemoState,
  updateMeeting,
  updateTaskStatus,
  validateAIAnalysisOutput,
} from './engine';
import { createInitialSeedState } from './seedData';

test('1. Initial Demo Seed State matches Q4 Business Operations Review specification', () => {
  const state = createInitialSeedState();
  assert.equal(state.scenarioName, 'Scenario: Q4 Business Operations Review');
  assert.equal(state.participants.length, 3);
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
    title: 'Q4 Security & Compliance Sync',
    date: '2026-11-04',
    participants: ['Elena Rostova', 'Marcus Vance'],
    agenda: 'Review DACH banking firewall rules and SOC2 DPA status',
    notes: 'Initial security alignment',
  });
  assert.equal(state.meetings.length, 3);
  const createdId = state.meetings[0].id;

  state = updateMeeting(state, createdId, {
    title: 'Q4 Security & Compliance Executive Sync',
    notes: 'Updated notes with auditor timeline',
  });
  assert.equal(state.meetings[0].title, 'Q4 Security & Compliance Executive Sync');
  assert.equal(state.meetings[0].notes, 'Updated notes with auditor timeline');
});

test('3. AI output validation enforces Unassigned / Unspecified for missing owners and dates', () => {
  const rawAIOutput = {
    summary: 'Reviewed infrastructure costs and rollout tasks.',
    decisions: [{ summary: 'Launch top 25 strategic accounts on Nov 10', owner: '' }],
    actionItems: [
      {
        title: 'Compile consolidated Q4 board deck infrastructure cost forecast',
        description: 'Prepare cost forecast',
        owner: 'unknown',
        priority: 'High',
        deadline: 'TBD',
      },
      {
        title: 'Deploy SLA latency alert webhook',
        description: 'Deploy to #ops-enterprise',
        owner: 'Marcus Vance',
        priority: 'High',
        deadline: '2026-11-04',
      },
    ],
    blockers: [{ description: 'Firewall IP whitelisting pending', owner: null, severity: 'High' }],
    nextSteps: ['Follow up with DACH security team'],
  };

  const validated = validateAIAnalysisOutput(rawAIOutput);
  assert.equal(validated.decisions[0].owner, 'Unspecified');
  assert.equal(validated.actionItems[0].owner, 'Unassigned');
  assert.equal(validated.actionItems[0].deadline, 'Unspecified');
  assert.equal(validated.actionItems[1].owner, 'Marcus Vance');
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
    title: 'Verify Frankfurt backup snapshot encryption',
    owner: 'Marcus Vance',
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
    'Upstream SDK patch delayed completion; carrying into Part 2 sprint.'
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

test('6. Report calculations and Handover acknowledgment work accurately', () => {
  let state = createInitialSeedState();
  const analysis = extractMeetingDeterministic(state.meetings[1].transcript);
  state = approveAIAnalysisToMeeting(state, 'mtg-q4-ops-2', analysis);
  state = updateTaskStatus(state, 'task-4', 'completed', 'Published EMEA escalation runbook.');
  state = carryForwardTask(state, 'task-2', 'mtg-q4-ops-2');
  state = acknowledgeHandover(state, 'hnd-1', 'Acknowledged by Priya Nair.');

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
