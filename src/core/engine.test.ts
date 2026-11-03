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
  evaluateWorkspaceDataQuality,
  executeCopilotTurn,
  extractMeetingDeterministic,
  ingestMeetingData,
  resetToDemoState,
  updateMeeting,
  updateTaskStatus,
  validateAIAnalysisOutput,
} from './engine';
import { createInitialSeedState } from './seedData';

test('1. Initial Workspace Seed State matches PwC India Q4 Business AI Review specification', () => {
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
  assert.equal(state.processingHistory?.length, 2);

  const metrics = calculateDashboardMetrics(state);
  assert.equal(metrics.completedTasks, 1);
  assert.equal(metrics.pendingTasks, 2);
  assert.equal(metrics.overdueTasks, 2);
  assert.equal(metrics.totalDecisions, 2);
  assert.equal(metrics.activeBlockers, 1);
  assert.equal(metrics.totalHandovers, 1);
});

test('2. Meeting creation, editing, and duplicate meeting submission detection', () => {
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
  assert.equal(state.meetings[0].ingestionMetadata?.inputType, 'manual');

  // Duplicate meeting submission (same title + date) must be rejected
  assert.throws(() => {
    createMeeting(state, {
      title: 'PwC India BFSI Security & DPDP Audit Sync',
      date: '2026-11-04',
      participants: ['Ananya Sharma'],
      agenda: 'Duplicate submission test',
    });
  }, /Duplicate meeting submission rejected/);

  state = updateMeeting(state, createdId, {
    title: 'PwC India BFSI Security & DPDP Partner Sync',
    notes: 'Updated notes with auditor timeline',
  });
  assert.equal(state.meetings[0].title, 'PwC India BFSI Security & DPDP Partner Sync');
  assert.equal(state.meetings[0].notes, 'Updated notes with auditor timeline');
});

test('3. Multi-Format Meeting Data Ingestion (TXT, CSV, JSON) & Processing History logs', () => {
  let state = createInitialSeedState();

  // 3a. TXT Ingestion with auto-extraction
  state = ingestMeetingData(state, {
    format: 'txt',
    rawContent: `Title: PwC India BFSI Firewall Sync
Date: 2026-11-05
Participants: Ananya Sharma, Rohan Deshmukh
Agenda: 1. Review RBI firewall egress rules
[00:00:10] Ananya Sharma: Decision made: We will enforce static egress IP whitelisting by Nov 8.
[00:01:00] Rohan Deshmukh: I will configure the NAT gateway egress pool by 2026-11-06. Priority is High.`,
    autoExtract: true,
  });
  assert.equal(state.meetings.length, 3);
  assert.equal(state.meetings[0].ingestionMetadata?.inputType, 'txt');
  assert.ok(state.meetings[0].aiSummary);

  // 3b. CSV Ingestion
  state = ingestMeetingData(state, {
    format: 'csv',
    rawContent: `title,date,participants,agenda,decision,actionItem,owner,priority,deadline
"PwC India Q4 FinOps Token Sync",2026-11-06,"Ananya Sharma|Rohan Deshmukh","1. Review token costs","Enable Redis semantic cache","Deploy semantic cache layer","Rohan Deshmukh",High,2026-11-08`,
    autoExtract: true,
  });
  assert.equal(state.meetings.length, 4);
  assert.equal(state.meetings[0].title, 'PwC India Q4 FinOps Token Sync');

  // 3c. JSON Ingestion
  state = ingestMeetingData(state, {
    format: 'json',
    rawContent: JSON.stringify({
      title: 'PwC India Red-Team Guardrails Review',
      date: '2026-11-07',
      participants: ['Priya Nair', 'Rohan Deshmukh'],
      agenda: '1. Evaluate prompt injection guardrails',
      decisions: [{ summary: 'Mandate automated PII NER redaction', owner: 'Priya Nair' }],
      actionItems: [
        {
          title: 'Integrate PII redaction middleware',
          owner: 'Rohan Deshmukh',
          priority: 'High',
          deadline: '2026-11-09',
        },
      ],
    }),
    autoExtract: true,
  });
  assert.equal(state.meetings.length, 5);
  assert.ok((state.processingHistory?.length || 0) >= 5);
});

test('4. AI output validation & extended extraction schema (keyDiscussionPoints, dependencies, openIssues, followUpRequirements)', () => {
  const rawAIOutput = {
    summary: 'Reviewed RAG vector latency and FinOps costs.',
    keyDiscussionPoints: ['Vector failover stayed below 18ms p99'],
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
    dependencies: ['Waiting on Mumbai Legal redlines'],
    openIssues: ['Pending RBI cloud firewall IP whitelisting'],
    followUpRequirements: ['Verify webhook deployment in next sync'],
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
  assert.ok((validated.validationWarnings?.length || 0) >= 2);
  assert.equal(validated.dependencies?.[0], 'Waiting on Mumbai Legal redlines');

  // Test deterministic transcript extraction on Meeting 2
  const state = createInitialSeedState();
  const extracted = extractMeetingDeterministic(state.meetings[1].transcript);
  assert.ok(extracted.decisions.length >= 2);
  assert.ok(extracted.actionItems.length >= 3);
  assert.ok((extracted.keyDiscussionPoints?.length || 0) >= 1);
  assert.ok((extracted.dependencies?.length || 0) >= 1);
  assert.ok((extracted.followUpRequirements?.length || 0) >= 1);
  const unassignedTask = extracted.actionItems.find((a) => a.owner === 'Unassigned');
  assert.ok(unassignedTask, 'Should mark task without owner in transcript as Unassigned');
  assert.equal(unassignedTask?.deadline, 'Unspecified');
});

test('5. Task creation, duplicate prevention, and Kanban status transitions (Pending -> In Progress -> Completed)', () => {
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

  // Duplicate task creation in the same meeting must throw
  assert.throws(() => {
    createTask(state, {
      title: 'Verify Mumbai vector snapshot AES-256 encryption',
      owner: 'Rohan Deshmukh',
      priority: 'High',
      deadline: '2026-11-06',
      sourceMeetingId: 'mtg-q4-ops-2',
    });
  }, /Duplicate action item rejected/);

  // Transition to In Progress (Kanban column move)
  state = updateTaskStatus(state, newTask.id, 'in-progress', 'Moved to In Progress on Kanban board.');
  const inProg = state.tasks.find((t) => t.id === newTask.id)!;
  assert.equal(inProg.status, 'in-progress');
  assert.equal(calculateDashboardMetrics(state).inProgressTasks, 1);

  // Transition to Completed
  state = updateTaskStatus(state, newTask.id, 'completed', 'Verified AES-256 snapshot keys.');
  const updated = state.tasks.find((t) => t.id === newTask.id)!;
  assert.equal(updated.status, 'completed');
  assert.ok(updated.completedAt);
  assert.equal(updated.statusHistory.length, 3);
});

test('6. Carry-forward logic preserves original source meeting and prevents duplicates', () => {
  let state = createInitialSeedState();
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

  assert.throws(() => {
    carryForwardTask(state, 'task-2', 'mtg-q4-ops-2');
  }, /already been carried/);
});

test('7. Data Quality & Relationship Integrity Evaluator detects warnings and prevents duplicate tasks on repeated AI approval', () => {
  let state = createInitialSeedState();
  const initialDq = evaluateWorkspaceDataQuality(state);
  assert.equal(initialDq.errorCount, 0);
  assert.equal(initialDq.orphanedRelationshipsCount, 0);

  const analysis = extractMeetingDeterministic(state.meetings[1].transcript);
  state = approveAIAnalysisToMeeting(state, 'mtg-q4-ops-2', analysis);
  const taskCountAfterFirstApproval = state.tasks.length;

  // Approving the same analysis a second time must not create duplicate tasks or decisions
  state = approveAIAnalysisToMeeting(state, 'mtg-q4-ops-2', analysis);
  assert.equal(state.tasks.length, taskCountAfterFirstApproval);

  const postApprovalDq = evaluateWorkspaceDataQuality(state);
  assert.equal(postApprovalDq.duplicateActionItemsDetected, 0);
  assert.ok(postApprovalDq.unassignedTasksCount >= 1);
});

test('8. Report calculations, Handover acknowledgment, and AI Copilot actions work accurately', () => {
  let state = createInitialSeedState();
  const analysis = extractMeetingDeterministic(state.meetings[1].transcript);
  state = approveAIAnalysisToMeeting(state, 'mtg-q4-ops-2', analysis);

  const copilotComplete = executeCopilotTurn(
    state,
    "Mark Priya Nair's compliance runbook task complete"
  );
  assert.ok(copilotComplete.executedAction?.includes('Completed Task'));
  state = copilotComplete.state;

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

test('9. Persistence serialization and Baseline Reset restore exact initial baseline', () => {
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
