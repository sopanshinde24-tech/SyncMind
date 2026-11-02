# SyncMind AI — Meeting & Workflow Intelligence Platform

SyncMind AI converts meeting discussions and transcripts into structured executive summaries, formal decisions, assigned action items, cross-meeting carry-forward workflows, and knowledge handovers. It prevents action items from getting forgotten between meetings while preserving original source lineage and human-in-the-loop verification.

---

## 1. Key Capabilities & Functional Modules

1. **Dashboard**: Real-time KPI summary (Total Meetings, Open Action Items, Completed Tasks, Overdue Tasks & Blockers), Weekly Execution & Completion Velocity bar chart, Ownership & Accountability breakdown, Recent Decisions, Active Blockers, and Priority Action Items.
2. **Meeting Management**: Full CRUD for meeting records including title, date, start time, duration, participant roster, agenda, executive notes, verbatim transcript, and linked/carried-forward tasks.
3. **AI Meeting Assistant (with Human-in-the-Loop Approval)**: Server-side Gemini structured JSON extraction (`/api/ai/analyze-meeting`) that generates an executive summary, decisions, action items, owners, deadlines, blockers, and next steps from transcripts or notes. Strictly avoids inventing owners or dates absent from the source text—marking missing fields as `Unassigned` or `Unspecified` for human review before saving.
4. **Action Item Management**: Create, assign, edit, complete, reopen, and delete tasks with live search, status filter tabs (`All`, `Overdue`, `Pending`, `Completed`), priority and owner filters, sorting, and an immutable Status History modal.
5. **Carry-Forward Accountability Engine**: Identifies unfinished (`pending` and `overdue`) tasks from earlier meetings and carries them into subsequent meetings while preserving `sourceMeetingId` / `sourceMeetingTitle`, appending to `statusHistory`, and preventing duplicate carry-forward records.
6. **Work Handover**: Structured knowledge transfer packages containing project context, completed work, pending tasks, active blockers, key decisions, and next steps, with recipient acknowledgment sign-off.
7. **Weekly Reports & AI Narrative**: Live calculation of task completion rates, owner workload distribution, overdue items, and carried-forward records, paired with an AI-synthesized executive narrative (`/api/ai/generate-report`) and one-click Markdown (`.md`) and JSON (`.json`) export.

---

## 2. Automatic Recruiter Demo (`Scenario: Q4 Business Operations Review`)

On first launch, SyncMind AI automatically loads the fictional scenario **Scenario: Q4 Business Operations Review**:
- **3 Participants**: Elena Rostova (VP of Operations), Marcus Vance (Principal Infrastructure Lead), and Priya Nair (Director of Customer Success).
- **2 Meetings**:
  - *Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment* (`2026-10-28`)
  - *Q4 Business Operations Review — Part 2: Enterprise Rollout & Handover Sync* (`2026-11-02`)
- **5 Action Items**: `1` Completed, `2` Pending, and `2` Overdue across different owners, priorities, and deadlines.
- **2 Decisions & 1 Active Blocker**.
- **1 Knowledge Handover Record**.

### Running the Guided Demo
Click **Start Guided Demo** in the top dark banner to automatically execute the 9-step sequence using real application functions and live database updates:
1. Open the sample meeting (*Part 2: Enterprise Rollout & Handover Sync*).
2. Display its transcript and business context.
3. Run the AI meeting analysis.
4. Display the generated summary, decisions, blockers, and action items.
5. Present the human review and approval step.
6. Save the approved action items into persistent storage.
7. Complete one pending task (*Publish onboarding runbook for EMEA enterprise support escalation*).
8. Carry an unfinished overdue task (*Migrate legacy Stripe webhook queue to dead-letter retry worker*) from Part 1 into Part 2 while preserving original source lineage.
9. Open the Weekly Report and display the updated figures.

You can also click **Complete All 9 Steps**, **Next Step**, **Reset Demo Data**, or **Explore Manually** at any time.

---

## 3. Architecture & Persistence

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons.
- **Backend**: Express (`server.ts`) serving `/api/*` REST endpoints and mounting Vite middleware on port `3000`.
- **AI Integration**: Server-side `@google/genai` SDK (`gemini-3.8-flash`) with `responseMimeType: "application/json"` and strict `responseSchema`. The API key (`process.env.GEMINI_API_KEY`) is accessed exclusively on the server and never exposed to the client. When `GEMINI_API_KEY` is not configured in a local evaluation environment, the server automatically falls back to `extractMeetingDeterministic`—a deterministic source-grounded transcript parser in `src/core/engine.ts` that extracts speakers, decisions, tasks, deadlines, and blockers directly from the transcript without inventing data.
- **Persistence**: The Express server persists all state changes to disk at `data/syncmind-db.json` (and mirrors state in browser `localStorage` as a secondary client resilience layer), ensuring all changes survive page refreshes and server restarts.

---

## 4. Installation, Startup & Testing

### Prerequisites
- Node.js 20+

### Environment Variables (`.env`)
Copy `.env.example` to `.env` and optionally provide your Gemini API key:
```bash
GEMINI_API_KEY="your_gemini_api_key_here"
```

### One-Command Startup
```bash
npm install
npm run dev
```
The full-stack server and client will start on `http://localhost:3000`.

### Running Automated QA Unit Tests
```bash
npm test
# or directly:
npx --yes tsx --test src/core/engine.test.ts
```

---

## 5. Known Limitations

- **File-Backed Persistence Scope**: By default, persistent storage uses a local JSON database file (`data/syncmind-db.json`) on the server filesystem plus `localStorage` client mirroring so the application runs immediately with zero external cloud database setup. In a multi-replica stateless container cluster without a mounted volume, state is scoped to the container instance lifecycle.
- **Reference Date**: To keep the preloaded *Q4 Business Operations Review* scenario deterministic (with exactly 1 completed, 2 pending, and 2 overdue tasks on launch), overdue status evaluation defaults to the scenario reference date `2026-11-02`.
