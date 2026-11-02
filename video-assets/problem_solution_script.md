# Video A — Problem and Solution Script (45–60 Seconds)

**Target Duration:** 55 seconds  
**Format:** 16:9 Desktop Screen Capture (1920x1080 or 1440x900) + Clean Executive Narration  
**Note:** This document provides the production script and exact screen-recording instructions. No pre-rendered `.mp4` file is bundled; use OBS Studio, QuickTime, or Playwright video capture to record directly against the live application on `http://localhost:3000`.

---

## Segment 1: The Problem — Forgotten Decisions & Unclear Ownership (0:00 – 0:10)

- **Visual / Screen Action:**
  - Start on the **SyncMind AI Dashboard** showing the preloaded **Scenario: Q4 Business Operations Review**.
  - Highlight the **Overdue Tasks & Blockers** metric card (`2` overdue tasks, `1` active blocker) and the **Action Items Requiring Attention** panel on the right.
- **Narration (0:00 – 0:10):**
  > "Teams make critical operational decisions in meetings every day—but the moment the call ends, action items get buried in raw notes, ownership turns ambiguous, and deadlines slip."

---

## Segment 2: Impact on Team Execution (0:10 – 0:20)

- **Visual / Screen Action:**
  - Click **Meetings** in the top navigation bar.
  - Select **Q4 Business Operations Review — Part 1: Infrastructure & SLA Alignment** (`2026-10-28`) and scroll to its verbatim transcript and linked tasks, pointing out the two High-priority items that went overdue before the next meeting.
- **Narration (0:10 – 0:20):**
  > "When follow-ups are missed across weekly syncs, engineering migrations stall, SLA sign-offs fall behind, and team members joining mid-quarter struggle to reconstruct what was decided."

---

## Segment 3: Introducing SyncMind AI — Transcript-to-Summary & Action Extraction (0:20 – 0:45)

- **Visual / Screen Action:**
  - Select **Q4 Business Operations Review — Part 2: Enterprise Rollout & Handover Sync** (`2026-11-02`) and click **Run AI Analysis**.
  - In the **AI Assistant** view, click **Run AI Meeting Analysis**.
  - Show the **Human Review & Approval Step** panel populating with:
    1. Executive Summary
    2. Extracted Decisions (`2` formal decisions)
    3. Extracted Action Items (`3` items, highlighting how an item without a source owner/date is automatically flagged `Unassigned` and `Unspecified` instead of hallucinated)
    4. Operational Blockers
  - Click **Approve & Save to Meeting**.
- **Narration (0:20 – 0:45):**
  > "SyncMind AI solves this by converting raw meeting transcripts into source-grounded summaries, formal decisions, blockers, and assigned tasks. It never fabricates missing owners or dates—marking them Unassigned or Unspecified for human review before you approve and commit them to the ledger."

---

## Segment 4: Carry-Forward Accountability & Final Business Outcome (0:45 – 0:60)

- **Visual / Screen Action:**
  - Click **Carry-Forward** in the top navigation bar.
  - Click **Carry Forward to Meeting** on the overdue task *"Migrate legacy Stripe webhook queue to dead-letter retry worker"*, showing the **Carry-Forward Lineage Log** preserving its original Part 1 source while linking it to Part 2.
  - Click **Reports** to show the updated completion rate, carry-forward count, and AI-synthesized Executive Report.
- **Narration (0:45 – 0:60):**
  > "With built-in carry-forward lineage, knowledge handovers, and live executive reports, unfinished work never disappears between meetings—giving leadership complete operational continuity."
