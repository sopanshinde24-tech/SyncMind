import { AppDatabaseState } from './types';

export const REFERENCE_DATE = '2026-11-02';

export function createInitialSeedState(): AppDatabaseState {
  return {
    scenarioName: 'Scenario: CreditVision & Enterprise AI — Q4 Financial Risk & Delivery Review',
    referenceDate: REFERENCE_DATE,
    lastUpdated: '2026-11-02T09:00:00Z',
    participants: [
      {
        id: 'part-0',
        name: 'Sopan Shinde',
        role: 'Lead Data & Backend Engineer',
        department: 'Financial Risk & AI Platform · Pune',
        email: 'sopan.shinde@creditvision-analytics.io',
        avatarUrl: '/assets/aistudio/Studio_Portrait_of_a_Young_Man_945b69db.png',
        initials: 'SS',
      },
      {
        id: 'part-1',
        name: 'Ananya Sharma',
        role: 'Director, Financial Risk & AI Products',
        department: 'Enterprise FinTech · Gurugram',
        email: 'ananya.sharma@creditvision-analytics.io',
        avatarUrl: '/src/assets/images/avatar_ananya_sharma_1793629242581.jpg',
        initials: 'AS',
      },
      {
        id: 'part-2',
        name: 'Rohan Deshmukh',
        role: 'Lead Data & Backend Engineer',
        department: 'Data Platform · Bengaluru',
        email: 'rohan.deshmukh@creditvision-analytics.io',
        avatarUrl: '/src/assets/images/avatar_rohan_deshmukh_1793629242530.jpg',
        initials: 'RD',
      },
      {
        id: 'part-3',
        name: 'Priya Nair',
        role: 'Senior Manager, Risk Governance & Delivery',
        department: 'Risk Analytics · Mumbai',
        email: 'priya.nair@creditvision-analytics.io',
        avatarUrl: '/src/assets/images/avatar_priya_nair_1793622799399.jpg',
        initials: 'PN',
      },
    ],
    meetings: [
      {
        id: 'mtg-q4-ops-1',
        title: 'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        date: '2026-10-28',
        startTime: '10:00 AM',
        durationMinutes: 45,
        participants: ['Sopan Shinde', 'Ananya Sharma', 'Rohan Deshmukh', 'Priya Nair'],
        agenda:
          '1. Review Mumbai cloud region vector index latency and failover readiness\n2. Finalize Q4 enterprise availability & SLA tiers for BFSI accounts\n3. Resolve document & transaction ingestion dead-letter queue backlog\n4. Align Responsible AI & DPDP Act compliance escalation runbook',
        notes:
          'Product and data engineering leadership reviewed Q3 pilot metrics and Q4 enterprise production readiness. Mumbai region database failover testing was prioritized ahead of festive banking volume. Legal still needs the updated enterprise SLA matrix by Nov 1. ISO 42001 & DPDP auditor sign-off on Mumbai telemetry is blocked by a pending client InfoSec counter-signature.',
        transcript: `[00:00:12] Ananya Sharma: Welcome team to Part 1 of our Q4 Financial Risk & Enterprise AI Delivery Review. Our priority across Gurugram, Bengaluru, and Mumbai today is locking down our risk data pipeline and enterprise SLA commitments before the November production cutover.
[00:01:04] Rohan Deshmukh: From the Data Platform Engineering side in Bengaluru, I completed the initial setup for the Mumbai region vector index failover test. I will finish the full Mumbai region RAG vector index failover & latency benchmark by 2026-10-30.
[00:02:18] Priya Nair: That benchmark is essential for our Mumbai BFSI banking deployments. Several enterprise platform sponsors asked about our validation guardrails and uptime SLA guarantees.
[00:03:05] Ananya Sharma: Decision made: We will standardize our enterprise GenAI tier SLA at 99.95% availability with mandatory grounded citation thresholds starting November 15. I will finalize the revised Q4 Enterprise GenAI SLA & governance matrix with Legal by 2026-11-01.
[00:04:22] Rohan Deshmukh: Understood. Also, Decision: We will freeze all non-critical embedding model & vector schema migrations during the festive quarter-end banking peak window from Nov 20 through Dec 2. One more urgent engineering item: I need to migrate our legacy LangChain ingestion queue to the async dead-letter worker by 2026-10-31 so large PDF regulatory filings never block real-time retrieval.
[00:05:40] Ananya Sharma: Are there any external compliance blockers we need to escalate to the executive steering committee?
[00:06:02] Ananya Sharma: Yes, we have one High-severity blocker: DPDP Act & ISO 42001 external auditor sign-off on the Mumbai BFSI telemetry pipeline is delayed awaiting the client InfoSec counter-signature.
[00:07:15] Priya Nair: For risk governance and platform delivery in Mumbai, I will publish the Responsible AI & DPDP compliance runbook for BFSI client rollout by 2026-11-05.`,
        aiSummary:
          'Product and engineering leadership aligned on Q4 risk pipeline resilience, DPDP Act compliance guardrails, and BFSI platform SLA standards. The team decided to standardize enterprise SLA availability at 99.95% with grounded citation thresholds and freeze schema migrations during peak banking windows. Four core engineering and governance action items were assigned across Rohan, Ananya, and Priya, while a client InfoSec counter-signature blocker on the Mumbai telemetry audit was escalated.',
        keyDiscussionPoints: [
          'Mumbai cloud region vector index failover readiness and sub-25ms p99 retrieval benchmark targets.',
          'Standardizing enterprise availability SLA at 99.95% with grounded citation guardrails for BFSI deployments.',
          'Async BullMQ dead-letter worker migration to prevent large PDF regulatory filings from stalling retrieval.',
          'DPDP Act & ISO 42001 compliance audit escalation and BFSI rollout runbook.',
        ],
        dependencies: [
          'Mumbai Legal contract redline review required before publishing the 99.95% SLA addendum.',
          'Upstream BullMQ connector patch required for async dead-letter worker cutover.',
        ],
        openIssues: [
          'DPDP Act & ISO 42001 external auditor sign-off on the Mumbai BFSI telemetry pipeline delayed awaiting client InfoSec counter-signature.',
        ],
        followUpRequirements: [
          'Verify completion of Mumbai region RAG vector index latency benchmarks in the Nov 2 Part 2 Delivery Sync.',
          'Escalate client InfoSec counter-signature to unblock DPDP & ISO 42001 audit.',
        ],
        nextSteps: [
          'Verify completion of Mumbai region RAG vector index latency benchmarks',
          'Escalate client InfoSec counter-signature to unblock DPDP & ISO 42001 audit',
          'Review uncompleted October engineering tasks in the Nov 2 Part 2 Delivery Sync',
        ],
        aiAnalyzedAt: '2026-10-28T11:00:00Z',
        carriedTaskIds: [],
        ingestionMetadata: {
          inputType: 'transcript-analysis',
          ingestedAt: '2026-10-28T09:55:00Z',
          validationStatus: 'Valid',
          validationNotes: [
            'All required meeting fields, 3 participant records, 2 decisions, and 4 action items verified.',
          ],
          sourceFormat: 'Structured Transcript + Executive Notes',
        },
        createdAt: '2026-10-28T09:55:00Z',
      },
      {
        id: 'mtg-q4-ops-2',
        title: 'Enterprise FinTech & AI Review — Part 2: Production Rollout & Handover Sync',
        date: '2026-11-02',
        startTime: '09:30 AM',
        durationMinutes: 50,
        participants: ['Ananya Sharma', 'Rohan Deshmukh', 'Priya Nair'],
        agenda:
          '1. Audit status of Part 1 engineering action items & carry forward overdue work\n2. Finalize Q4 BFSI rollout schedule & guardrails telemetry alert webhook\n3. Review Q3 UAT citation accuracy audit & Mumbai delivery handover',
        notes:
          "Follow-up Q4 product and data engineering session. Need to run AI transcript analysis on today's discussion to capture new leadership decisions, extract action items, and carry forward unfinished engineering tasks from the Oct 28 review.",
        transcript: `[00:00:15] Ananya Sharma: Welcome back Rohan and Priya to Part 2 of our Q4 Financial Risk & Enterprise AI Delivery Review. Let's review where we stand on last week's engineering deliverables and lock in our November production rollout plan.
[00:01:10] Rohan Deshmukh: The Mumbai region RAG vector index failover & latency benchmark is 100% completed—p99 retrieval latency stayed under 18ms during simulated node failure. However, migrating the legacy LangChain ingestion queue to the async dead-letter worker slipped past the October 31 deadline due to an upstream connector patch; we need to carry that task forward into this week's sprint.
[00:02:25] Ananya Sharma: Noted, and my revised Q4 Enterprise GenAI SLA & governance matrix is also one day overdue waiting on final clause redlines from Mumbai Legal. Decision: We will launch the phased Q4 Enterprise GenAI Copilot rollout to our top 15 Indian BFSI and manufacturing accounts on 2026-11-10 rather than waiting for the mid-month batch.
[00:03:45] Priya Nair: That gives our Mumbai and Gurugram engineering teams clear cutover dates. Decision: All Tier-1 BFSI client deployments will transition to the dedicated 15-minute Responsible AI governance desk managed by Delivery Assurance starting 2026-11-06.
[00:04:50] Rohan Deshmukh: Action item for me: I will deploy the real-time hallucination & token latency telemetry webhook to the #fintech-ai-ops channel by 2026-11-04. Priority is High.
[00:05:35] Priya Nair: I am already tracking the Q3 client UAT feedback logs audit for 2026-11-08. In addition, I will schedule executive AI governance walkthroughs with the top 10 Mumbai BFSI client sponsors by 2026-11-06. Priority is High.
[00:06:20] Ananya Sharma: We also need someone to compile the consolidated Q4 executive steering deck token FinOps cost forecast, though we haven't assigned an owner or exact due date yet. Also note a new blocker: Production API rate-limit sandbox testing for our Mumbai private sector bank client is blocked by pending RBI cloud firewall IP whitelisting from their infosec team.`,
        carriedTaskIds: [],
        ingestionMetadata: {
          inputType: 'manual',
          ingestedAt: '2026-11-02T09:00:00Z',
          validationStatus: 'Valid',
          validationNotes: [
            'Meeting metadata, 3 participants, and 7-line verbatim transcript ingested. Ready for AI extraction.',
          ],
          sourceFormat: 'Live Meeting Transcript Stream',
        },
        createdAt: '2026-11-02T09:00:00Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Complete Mumbai region RAG vector index failover & latency benchmark',
        description:
          'Execute multi-zone failover simulation on Mumbai cloud cluster and verify p99 vector retrieval latency stays below 25ms.',
        owner: 'Rohan Deshmukh',
        priority: 'High',
        deadline: '2026-10-30',
        status: 'completed',
        dependencies: ['Mumbai multi-zone cloud cluster provisioning'],
        sourceMeetingId: 'mtg-q4-ops-1',
        sourceMeetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        currentMeetingId: 'mtg-q4-ops-1',
        currentMeetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-10-28T10:45:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Extracted from Enterprise FinTech & AI Review — Part 1',
            meetingId: 'mtg-q4-ops-1',
          },
          {
            timestamp: '2026-10-30T16:20:00Z',
            fromStatus: 'pending',
            toStatus: 'completed',
            note: 'Failover verified at 18ms p99 retrieval latency; benchmark report shared with engineering leadership.',
            meetingId: 'mtg-q4-ops-1',
          },
        ],
        createdAt: '2026-10-28T10:45:00Z',
        completedAt: '2026-10-30T16:20:00Z',
      },
      {
        id: 'task-2',
        title: 'Migrate legacy LangChain ingestion queue to async dead-letter worker',
        description:
          'Move synchronous PDF chunking and embedding handlers to isolated BullMQ dead-letter worker to eliminate ingestion bottlenecks.',
        owner: 'Rohan Deshmukh',
        priority: 'High',
        deadline: '2026-10-31',
        status: 'overdue',
        dependencies: ['Upstream BullMQ connector patch'],
        sourceMeetingId: 'mtg-q4-ops-1',
        sourceMeetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        currentMeetingId: 'mtg-q4-ops-1',
        currentMeetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-10-28T10:45:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Assigned during Enterprise FinTech & AI Review — Part 1',
            meetingId: 'mtg-q4-ops-1',
          },
          {
            timestamp: '2026-11-01T00:05:00Z',
            fromStatus: 'pending',
            toStatus: 'overdue',
            note: 'Deadline 2026-10-31 passed awaiting upstream connector patch.',
            meetingId: 'mtg-q4-ops-1',
          },
        ],
        createdAt: '2026-10-28T10:45:00Z',
      },
      {
        id: 'task-3',
        title: 'Finalize revised Q4 Enterprise GenAI SLA & governance matrix with Legal',
        description:
          'Incorporate 99.95% availability guarantee, DPDP Act clauses, and grounded citation thresholds into the standard enterprise SLA addendum.',
        owner: 'Ananya Sharma',
        priority: 'High',
        deadline: '2026-11-01',
        status: 'overdue',
        dependencies: ['Mumbai Legal clause redline approval'],
        sourceMeetingId: 'mtg-q4-ops-1',
        sourceMeetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        currentMeetingId: 'mtg-q4-ops-1',
        currentMeetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-10-28T10:45:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Assigned during Enterprise FinTech & AI Review — Part 1',
            meetingId: 'mtg-q4-ops-1',
          },
          {
            timestamp: '2026-11-02T00:05:00Z',
            fromStatus: 'pending',
            toStatus: 'overdue',
            note: 'Deadline 2026-11-01 passed awaiting final redline review from Mumbai Legal.',
            meetingId: 'mtg-q4-ops-1',
          },
        ],
        createdAt: '2026-10-28T10:45:00Z',
      },
      {
        id: 'task-4',
        title: 'Publish Responsible AI & DPDP compliance runbook for BFSI client rollout',
        description:
          'Document Tier-1 prompt injection incident workflows, PII redaction checks, and Mumbai cluster diagnostic checklists.',
        owner: 'Priya Nair',
        priority: 'Medium',
        deadline: '2026-11-05',
        status: 'pending',
        dependencies: ['ISO 42001 & DPDP telemetry sign-off'],
        sourceMeetingId: 'mtg-q4-ops-1',
        sourceMeetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        currentMeetingId: 'mtg-q4-ops-1',
        currentMeetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-10-28T10:45:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Assigned during Enterprise FinTech & AI Review — Part 1',
            meetingId: 'mtg-q4-ops-1',
          },
        ],
        createdAt: '2026-10-28T10:45:00Z',
      },
      {
        id: 'task-5',
        title: 'Audit Q3 client UAT feedback logs for top 3 RAG citation accuracy gaps',
        description:
          'Synthesize UAT evaluation logs from Q3 enterprise pilots to prioritize Q4 hybrid-search reranker tuning.',
        owner: 'Priya Nair',
        priority: 'Low',
        deadline: '2026-11-08',
        status: 'pending',
        dependencies: ['Q3 UAT telemetry export'],
        sourceMeetingId: 'mtg-q4-ops-2',
        sourceMeetingTitle:
          'Enterprise FinTech & AI Review — Part 2: Production Rollout & Handover Sync',
        currentMeetingId: 'mtg-q4-ops-2',
        currentMeetingTitle:
          'Enterprise FinTech & AI Review — Part 2: Production Rollout & Handover Sync',
        carriedFromMeetingIds: [],
        statusHistory: [
          {
            timestamp: '2026-11-02T09:15:00Z',
            fromStatus: 'created',
            toStatus: 'pending',
            note: 'Logged ahead of Enterprise FinTech & AI Review — Part 2',
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
        meetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        summary:
          'Standardize enterprise GenAI tier SLA at 99.95% availability with mandatory grounded citation thresholds starting November 15.',
        owner: 'Ananya Sharma',
        date: '2026-10-28',
        impactArea: 'Platform SLA & Risk Governance',
      },
      {
        id: 'dec-2',
        meetingId: 'mtg-q4-ops-1',
        meetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        summary:
          'Freeze non-critical embedding model & vector schema migrations during the festive banking peak window (Nov 20 – Dec 2).',
        owner: 'Rohan Deshmukh',
        date: '2026-10-28',
        impactArea: 'Data Platform Engineering',
      },
    ],
    blockers: [
      {
        id: 'blk-1',
        meetingId: 'mtg-q4-ops-1',
        meetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        description:
          'DPDP Act & ISO 42001 external auditor sign-off on the Mumbai BFSI telemetry pipeline is delayed awaiting client InfoSec counter-signature.',
        owner: 'Ananya Sharma',
        severity: 'High',
        status: 'Active',
        reportedAt: '2026-10-28',
      },
    ],
    carryForwardHistory: [],
    handovers: [
      {
        id: 'hnd-1',
        title: 'Enterprise BFSI Risk Pipeline Rollout & Governance Escalation Handover',
        projectContext:
          'Transitioning operational ownership of the Q4 Enterprise Rollout and Mumbai BFSI governance communication from Product Leadership (Ananya Sharma, Gurugram) to Risk Governance & Delivery Assurance (Priya Nair, Mumbai) ahead of the November 10 production launch.',
        fromPerson: 'Ananya Sharma',
        toPerson: 'Priya Nair',
        createdAt: '2026-11-01T17:30:00Z',
        completedWork: [
          'Completed Mumbai region RAG vector index failover & latency benchmark at 18ms p99 retrieval (Rohan Deshmukh)',
          'Approved 99.95% enterprise SLA and grounded citation threshold across Product and Engineering',
          'Established festive quarter-end vector schema migration freeze window (Nov 20 – Dec 2)',
        ],
        pendingTasks: [
          'Finalize revised Q4 Enterprise GenAI SLA & governance matrix with Legal (Ananya Sharma — Overdue)',
          'Publish Responsible AI & DPDP compliance runbook for BFSI client rollout (Priya Nair — Due Nov 5)',
          'Migrate legacy LangChain ingestion queue to async dead-letter worker (Rohan Deshmukh — Overdue)',
        ],
        blockers: [
          'DPDP Act & ISO 42001 external auditor sign-off on Mumbai BFSI telemetry pipeline delayed awaiting client InfoSec counter-signature',
        ],
        decisions: [
          'Standardize enterprise GenAI tier SLA at 99.95% availability starting November 15',
          'Freeze non-critical embedding model & vector schema migrations from Nov 20 to Dec 2',
        ],
        nextSteps: [
          'Acknowledge handover and circulate DPDP compliance runbook to Mumbai & Bengaluru engineering squads by Nov 5',
          'Brief top 10 Mumbai BFSI platform sponsors on the 99.95% SLA addendum once Legal signs off',
        ],
        status: 'Pending Acknowledgment',
      },
    ],
    processingHistory: [
      {
        id: 'proc-seed-1',
        meetingId: 'mtg-q4-ops-1',
        meetingTitle:
          'Enterprise FinTech & AI Review — Part 1: Risk Pipeline Architecture & Guardrails',
        timestamp: '2026-10-28T11:00:00Z',
        inputType: 'transcript-analysis',
        extractionStatus: 'Completed',
        sourceEngine: 'gemini',
        decisionsExtracted: 2,
        actionItemsExtracted: 4,
        validationStatus: 'Valid',
        errors: [],
        warnings: [],
      },
      {
        id: 'proc-seed-2',
        meetingId: 'mtg-q4-ops-2',
        meetingTitle:
          'Enterprise FinTech & AI Review — Part 2: Production Rollout & Handover Sync',
        timestamp: '2026-11-02T09:00:00Z',
        inputType: 'manual',
        extractionStatus: 'Ingested (Pending Extraction)',
        sourceEngine: 'ingestion-validator',
        decisionsExtracted: 0,
        actionItemsExtracted: 1,
        validationStatus: 'Valid',
        errors: [],
        warnings: [
          'Meeting transcript ingested (7 speaker turns); awaiting AI extraction and human approval.',
        ],
      },
    ],
  };
}
