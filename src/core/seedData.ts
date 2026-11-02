import { AppDatabaseState } from './types';

export const REFERENCE_DATE = '2026-11-02';

export function createInitialSeedState(): AppDatabaseState {
  return {
    scenarioName: 'Scenario: Q4 Business Operations Review',
    referenceDate: REFERENCE_DATE,
    lastUpdated: '2026-11-02T09:00:00Z',
    participants: [
      {
        id: 'part-1',
        name: 'Elena Rostova',
        role: 'VP of Operations',
        department: 'Executive Operations',
        email: 'elena.rostova@syncmind.io',
        avatarUrl: '/src/assets/images/avatar_elena_rostova_1793622798344.jpg',
        initials: 'ER',
      },
      {
        id: 'part-2',
        name: 'Marcus Vance',
        role: 'Principal Infrastructure Lead',
        department: 'Platform Engineering',
        email: 'marcus.vance@syncmind.io',
        avatarUrl: '/src/assets/images/avatar_marcus_vance_1793622799111.jpg',
        initials: 'MV',
      },
      {
        id: 'part-3',
        name: 'Priya Nair',
        role: 'Director of Customer Success',
        department: 'Enterprise Success',
        email: 'priya.nair@syncmind.io',
        avatarUrl: '/src/assets/images/avatar_priya_nair_1793622799399.jpg',
        initials: 'PN',
      },
    ],
    meetings: [
      {
        id: 'mtg-q4-ops-1',
        title: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        date: '2026-10-28',
        startTime: '10:00 AM',
        durationMinutes: 45,
        participants: ['Elena Rostova', 'Marcus Vance', 'Priya Nair'],
        agenda:
          '1. Review EU-Central database latency and failover readiness\n2. Finalize Q4 enterprise SLA uptime credit tiers\n3. Resolve Stripe billing webhook queue backlog\n4. Align EMEA enterprise support escalation runbook',
        notes:
          'Team reviewed Q3 post-mortem metrics and Q4 enterprise readiness. EU-Central read-replica stress testing was prioritized ahead of peak seasonal traffic. Legal still needs the updated SLA credit tier matrix by Nov 1. SOC2 auditor sign-off on EU logging is blocked by a pending DPA counter-signature.',
        transcript: `[00:00:12] Elena Rostova: Let's kick off Part 1 of our Q4 Business Operations Review. Our primary goal today is locking down infrastructure stability and enterprise SLA commitments before the November peak window.
[00:01:04] Marcus Vance: On the infrastructure side, I completed the initial preparation for the EU-Central read-replica failover stress test. I will finish the full failover stress test and publish the latency benchmark report by 2026-10-30.
[00:02:18] Priya Nair: That's critical for our Frankfurt enterprise accounts. However, several EMEA renewal prospects asked about our uptime guarantees.
[00:03:05] Elena Rostova: Decision made: We will standardize our enterprise tier SLA uptime guarantee at 99.95% with automated credit triggers starting November 15. I will finalize the revised Q4 Enterprise SLA credit tier matrix with Legal by 2026-11-01.
[00:04:22] Marcus Vance: Understood. Also, Decision: We will freeze all non-critical database schema migrations during the Black Friday to Cyber Monday peak window from Nov 20 through Dec 2. One more urgent engineering item: I need to migrate our legacy Stripe webhook queue to the new dead-letter retry worker by 2026-10-31 so billing retries never block checkout events.
[00:05:40] Elena Rostova: Are there any external blockers we need to flag?
[00:06:02] Elena Rostova: Yes, we have one High-severity blocker: SOC2 Type II external auditor sign-off on the new EU-Central logging pipeline is delayed awaiting the vendor DPA counter-signature.
[00:07:15] Priya Nair: For customer operations, I will publish the updated onboarding runbook for EMEA enterprise support escalation by 2026-11-05.`,
        aiSummary:
          'The operations and engineering leadership aligned on Q4 infrastructure resilience and enterprise SLA standards. The team decided to standardize enterprise SLA guarantees at 99.95% uptime and institute a schema migration freeze during peak holiday traffic. Four key operational and engineering action items were assigned across Marcus, Elena, and Priya, while a vendor DPA counter-signature blocker on the SOC2 EU logging pipeline was flagged.',
        nextSteps: [
          'Verify completion of EU-Central read-replica stress benchmarks',
          'Escalate vendor DPA counter-signature with Legal to unblock SOC2 audit',
          'Review uncompleted October tasks in the Nov 2 Q4 Operations Sync',
        ],
        aiAnalyzedAt: '2026-10-28T11:00:00Z',
        carriedTaskIds: [],
        createdAt: '2026-10-28T09:55:00Z',
      },
      {
        id: 'mtg-q4-ops-2',
        title: 'Q4 Business Operations Review — Part 2: Enterprise Rollout & Handover Sync',
        date: '2026-11-02',
        startTime: '09:30 AM',
        durationMinutes: 50,
        participants: ['Elena Rostova', 'Marcus Vance', 'Priya Nair'],
        agenda:
          '1. Audit status of Part 1 action items & carry forward overdue work\n2. Finalize Q4 enterprise customer rollout schedule & telemetry dashboard\n3. Review Q3 churn survey audit & EMEA support handover',
        notes:
          'Follow-up Q4 operations session. Need to run AI transcript analysis on today\'s discussion to capture new decisions, extract action items, and carry forward unfinished tasks from the Oct 28 review.',
        transcript: `[00:00:15] Elena Rostova: Welcome back everyone to Part 2 of our Q4 Business Operations Review. First, let's address where we stand on last week's items and lock in our November rollout plan.
[00:01:10] Marcus Vance: The EU-Central read-replica stress test is 100% completed—p99 latency stayed under 18ms during simulated node failure. However, the Stripe webhook dead-letter worker migration slipped past the October 31 deadline because of an upstream SDK patch; we need to carry that task forward into this week's sprint.
[00:02:25] Elena Rostova: Agreed, and my revised Q4 Enterprise SLA credit tier matrix is also one day overdue waiting on redlines from outside counsel. Decision: We will launch the phased Q4 Enterprise SLA rollout to our top 25 strategic accounts on 2026-11-10 rather than waiting for the mid-month batch.
[00:03:45] Priya Nair: That gives my team clear dates. Decision: All EMEA Tier-1 enterprise accounts will transition to the dedicated 15-minute response queue managed by Customer Success starting 2026-11-06.
[00:04:50] Marcus Vance: Action item for me: I will deploy the real-time SLA latency telemetry alert webhook to the #ops-enterprise channel by 2026-11-04. Priority is High.
[00:05:35] Priya Nair: I am already tracking the Q3 churned account exit survey audit for 2026-11-08. In addition, I will schedule executive QBR briefing calls with the top 10 EMEA renewal accounts by 2026-11-06. Priority is High.
[00:06:20] Elena Rostova: We also need someone to compile the consolidated Q4 board deck infrastructure cost forecast, though we haven't assigned an owner or exact due date yet. Also note a new blocker: Production API rate-limit sandbox testing for DACH banking clients is blocked by pending firewall IP whitelisting from their security team.`,
        carriedTaskIds: [],
        createdAt: '2026-11-02T09:00:00Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Complete EU-Central read-replica failover stress test',
        description:
          'Execute multi-zone failover simulation on Frankfurt cluster and verify p99 read latency stays below 25ms.',
        owner: 'Marcus Vance',
        priority: 'High',
        deadline: '2026-10-30',
        status: 'completed',
        sourceMeetingId: 'mtg-q4-ops-1',
        sourceMeetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        currentMeetingId: 'mtg-q4-ops-1',
        currentMeetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-10-28T10:45:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Extracted from Q4 Business Operations Review — Part 1',
            meetingId: 'mtg-q4-ops-1',
          },
          {
            timestamp: '2026-10-30T16:20:00Z',
            fromStatus: 'pending',
            toStatus: 'completed',
            note: 'Failover verified at 18ms p99 latency; benchmark report published.',
            meetingId: 'mtg-q4-ops-1',
          },
        ],
        createdAt: '2026-10-28T10:45:00Z',
        completedAt: '2026-10-30T16:20:00Z',
      },
      {
        id: 'task-2',
        title: 'Migrate legacy Stripe webhook queue to dead-letter retry worker',
        description:
          'Move synchronous billing webhook handlers to isolated BullMQ dead-letter worker to eliminate checkout retry bottlenecks.',
        owner: 'Marcus Vance',
        priority: 'High',
        deadline: '2026-10-31',
        status: 'overdue',
        sourceMeetingId: 'mtg-q4-ops-1',
        sourceMeetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        currentMeetingId: 'mtg-q4-ops-1',
        currentMeetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-10-28T10:45:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Assigned during Q4 Business Operations Review — Part 1',
            meetingId: 'mtg-q4-ops-1',
          },
          {
            timestamp: '2026-11-01T00:05:00Z',
            fromStatus: 'pending',
            toStatus: 'overdue',
            note: 'Deadline 2026-10-31 passed without completion.',
            meetingId: 'mtg-q4-ops-1',
          },
        ],
        createdAt: '2026-10-28T10:45:00Z',
      },
      {
        id: 'task-3',
        title: 'Finalize revised Q4 Enterprise SLA credit tier matrix with Legal',
        description:
          'Incorporate 99.95% uptime guarantee and automated service credit schedule into the standard Enterprise MSA addendum.',
        owner: 'Elena Rostova',
        priority: 'High',
        deadline: '2026-11-01',
        status: 'overdue',
        sourceMeetingId: 'mtg-q4-ops-1',
        sourceMeetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        currentMeetingId: 'mtg-q4-ops-1',
        currentMeetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-10-28T10:45:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Assigned during Q4 Business Operations Review — Part 1',
            meetingId: 'mtg-q4-ops-1',
          },
          {
            timestamp: '2026-11-02T00:05:00Z',
            fromStatus: 'pending',
            toStatus: 'overdue',
            note: 'Deadline 2026-11-01 passed awaiting final redline review.',
            meetingId: 'mtg-q4-ops-1',
          },
        ],
        createdAt: '2026-10-28T10:45:00Z',
      },
      {
        id: 'task-4',
        title: 'Publish onboarding runbook for EMEA enterprise support escalation',
        description:
          'Document Tier-1 SLA response workflows, PagerDuty rotation handoffs, and Frankfurt cluster diagnostic checklists.',
        owner: 'Priya Nair',
        priority: 'Medium',
        deadline: '2026-11-05',
        status: 'pending',
        sourceMeetingId: 'mtg-q4-ops-1',
        sourceMeetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        currentMeetingId: 'mtg-q4-ops-1',
        currentMeetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-10-28T10:45:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Assigned during Q4 Business Operations Review — Part 1',
            meetingId: 'mtg-q4-ops-1',
          },
        ],
        createdAt: '2026-10-28T10:45:00Z',
      },
      {
        id: 'task-5',
        title: 'Audit Q3 churned account exit surveys for top 3 integration friction points',
        description:
          'Synthesize exit interview notes from Q3 mid-market and enterprise churn to prioritize Q4 onboarding improvements.',
        owner: 'Priya Nair',
        priority: 'Low',
        deadline: '2026-11-08',
        status: 'pending',
        sourceMeetingId: 'mtg-q4-ops-2',
        sourceMeetingTitle: 'Q4 Business Operations Review — Part 2: Enterprise Rollout & Handover Sync',
        currentMeetingId: 'mtg-q4-ops-2',
        currentMeetingTitle: 'Q4 Business Operations Review — Part 2: Enterprise Rollout & Handover Sync',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-11-02T09:15:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Logged ahead of Q4 Business Operations Review — Part 2',
            meetingId: 'mtg-q4-ops-2',
          },
        ],
        createdAt: '2026-11-02T09:15:00Z',
      },
    ],
    decisions: [
      {
        id: 'dec-1',
        meetingId: 'mtg-q4-ops-1',
        meetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        summary:
          'Standardize enterprise tier SLA uptime guarantee at 99.95% with automated credit triggers starting November 15.',
        owner: 'Elena Rostova',
        date: '2026-10-28',
        impactArea: 'Enterprise Contracts & SLA',
      },
      {
        id: 'dec-2',
        meetingId: 'mtg-q4-ops-1',
        meetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        summary:
          'Freeze non-critical database schema migrations during the Black Friday / Cyber Monday peak window (Nov 20 – Dec 2).',
        owner: 'Marcus Vance',
        date: '2026-10-28',
        impactArea: 'Platform Reliability',
      },
    ],
    blockers: [
      {
        id: 'blk-1',
        meetingId: 'mtg-q4-ops-1',
        meetingTitle: 'Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment',
        description:
          'SOC2 Type II external auditor sign-off on the new EU-Central logging pipeline is delayed awaiting vendor DPA counter-signature.',
        owner: 'Elena Rostova',
        severity: 'High',
        status: 'Active',
        reportedAt: '2026-10-28',
      },
    ],
    carryForwardHistory: [],
    handovers: [
      {
        id: 'hnd-1',
        title: 'EMEA Enterprise Onboarding & SLA Escalation Handover',
        projectContext:
          'Transitioning operational ownership of the Q4 EMEA Enterprise SLA Rollout and Frankfurt cluster incident response communication from Executive Operations (Elena Rostova) to Enterprise Customer Success (Priya Nair) ahead of the November 10 strategic account launch.',
        fromPerson: 'Elena Rostova',
        toPerson: 'Priya Nair',
        createdAt: '2026-11-01T17:30:00Z',
        completedWork: [
          'Completed EU-Central read-replica failover stress test at 18ms p99 latency (Marcus Vance)',
          'Approved 99.95% enterprise SLA uptime standard across Executive Operations and Engineering',
          'Established peak holiday schema migration freeze window (Nov 20 – Dec 2)',
        ],
        pendingTasks: [
          'Finalize revised Q4 Enterprise SLA credit tier matrix with Legal (Elena Rostova — Overdue)',
          'Publish onboarding runbook for EMEA enterprise support escalation (Priya Nair — Due Nov 5)',
          'Migrate legacy Stripe webhook queue to dead-letter retry worker (Marcus Vance — Overdue)',
        ],
        blockers: [
          'SOC2 Type II external auditor sign-off on EU-Central logging pipeline delayed awaiting vendor DPA counter-signature',
        ],
        decisions: [
          'Standardize enterprise tier SLA uptime guarantee at 99.95% starting November 15',
          'Freeze non-critical schema migrations from Nov 20 to Dec 2',
        ],
        nextSteps: [
          'Acknowledge handover and circulate EMEA support runbook to regional TAMs by Nov 5',
          'Brief top 10 EMEA renewal accounts on the 99.95% SLA addendum once Legal signs off',
        ],
        status: 'Pending Acknowledgment',
      },
    ],
  };
}
