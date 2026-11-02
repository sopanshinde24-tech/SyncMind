# Video B — Live Product Demo Walkthrough Script (60–90 Seconds)

**Target Duration:** 75 seconds  
**Format:** Live 1440x900 Browser Capture of `http://localhost:3000`  
**Scenario:** Q4 Business Operations Review (Elena Rostova, Marcus Vance, Priya Nair)

---

## Pre-Recording Checklist

1. Start the application with `npm run dev` and open `http://localhost:3000`.
2. Click **Reset Demo Data** in the dark Recruiter Demo bar to ensure the baseline state is loaded (`2` meetings, `5` tasks: `1` completed, `2` pending, `2` overdue, `2` decisions, `1` blocker, `1` handover).
3. Set browser zoom to `100%` at `1440x900` resolution.

---

## Step-by-Step Recording & Narration Walkthrough

### 0:00 – 0:12 | Dashboard Overview & Recruiter Demo Controls
- **Screen Action:** Pause for 3 seconds on the **Dashboard**. Hover over the 4 KPI cards (`2` Total Meetings, `4` Open Action Items, `1` Completed Task, `2` Overdue Tasks) and the **Start Guided Demo** button.
- **Narration:** "Welcome to SyncMind AI. Out of the box, the platform loads our Q4 Business Operations Review scenario with three participants, two meetings, and five tracked deliverables. Recruiters can click Start Guided Demo to watch the entire nine-step workflow automatically, or step through each module interactively."

### 0:12 – 0:25 | Meeting Management & Transcript Inspection
- **Screen Action:** Click **Meetings** in the top navigation bar, then select **Q4 Business Operations Review — Part 2: Enterprise Rollout & Handover Sync** (`2026-11-02`). Scroll smoothly to the dark **Meeting Transcript** box.
- **Narration:** "In Meeting Management, every session stores its participants, agenda, executive notes, and verbatim transcript. Let's analyze Part 2 of our Q4 Operations Review."

### 0:25 – 0:45 | AI Meeting Assistant & Human-in-the-Loop Approval
- **Screen Action:** Click **Run AI Analysis** to open the **AI Assistant** tab. Click **Run AI Meeting Analysis**. Once the structured output renders on the right, point to the third action item (*Compile the consolidated Q4 board deck infrastructure cost forecast*) showing `Unassigned` and `Unspecified`, then edit the owner to `Elena Rostova` and click **Approve & Save to Meeting**.
- **Narration:** "When we run the AI Meeting Assistant, our server-side Gemini pipeline extracts the executive summary, formal decisions, action items, and blockers. Notice how the board deck forecast had no owner or deadline in the transcript, so SyncMind AI strictly marks it Unassigned and Unspecified. During human review, we can assign it to Elena Rostova and click Approve and Save."

### 0:45 – 0:58 | Action Item Management & Completing a Task
- **Screen Action:** Click **Action Items** in the top navigation bar. Filter by **Pending**, then click the status button next to *"Publish onboarding runbook for EMEA enterprise support escalation"* (Priya Nair) to mark it **Completed**. Click the History icon (`View status history`) to show the timestamped status audit modal, then close the modal.
- **Narration:** "In the Action Item Ledger, all newly approved tasks are immediately searchable and filterable. As Priya finishes the EMEA escalation runbook, we mark it completed—recording a permanent timestamp in the task's status history."

### 0:58 – 1:12 | Carry-Forward System & Knowledge Handover
- **Screen Action:** Click **Carry-Forward** in the top navigation bar. Locate Marcus Vance's overdue task *"Migrate legacy Stripe webhook queue to dead-letter retry worker"* from Part 1, type `"Carrying into Part 2 sprint after upstream SDK patch"`, and click **Carry Forward to Meeting**. Then click **Work Handover** and click **Acknowledge Handover as Priya Nair**.
- **Narration:** "For unfinished work from Part 1—like Marcus's overdue Stripe webhook migration—the Carry-Forward Engine moves the task into Part 2 while preserving its original source meeting and preventing duplicates. And in Work Handover, Priya can formally acknowledge incoming operational ownership."

### 1:12 – 1:25 | Weekly Executive Report & Export
- **Screen Action:** Click **Reports** in the top navigation bar. Click **Refresh AI Executive Narrative**, highlight the updated KPI strip (`2` Completed, `1` Carried Forward, `4` Decisions Logged), and click **Export Markdown**.
- **Narration:** "Finally, the Reports module synthesizes live completion rates, owner workloads, overdue risks, and an AI-written executive summary ready for one-click Markdown or JSON export."
