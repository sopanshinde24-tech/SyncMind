# SyncMind AI — Visual Storyboard (Video A & Video B)

## Video A: Problem & Solution (45–60s)

| Scene | Timecode | Visual Composition | UI State / Component | Key Takeaway |
| :--- | :--- | :--- | :--- | :--- |
| **A1** | `00:00 - 00:10` | Wide shot of **Dashboard** with focus on the `2 Overdue Tasks` and `1 Active Blocker` KPI card. | `DashboardView` (`metric-overdue-tasks`) | Meetings generate decisions, but follow-ups slip without structured tracking. |
| **A2** | `00:10 - 00:20` | Split view of **Meetings** showing the Oct 28 Part 1 transcript alongside overdue engineering & legal action items. | `MeetingsView` (`mtg-q4-ops-1`) | Disconnected notes create execution gaps and onboarding friction. |
| **A3** | `00:20 - 00:35` | **AI Assistant** split workspace: dark verbatim transcript on left, structured JSON extraction on right. | `AIAssistantView` (`ai-review-panel`) | AI extracts decisions, tasks, and blockers while marking missing info `Unassigned` / `Unspecified`. |
| **A4** | `00:35 - 00:45` | Human-in-the-loop review and clicking **Approve & Save to Meeting** with green confirmation banner. | `AIAssistantView` (`approve-save-analysis-btn`) | Human verification prevents AI hallucinations from polluting the task ledger. |
| **A5** | `00:45 - 00:60` | **Carry-Forward** lineage log updating live, followed by the **Reports** view showing updated completion metrics. | `CarryForwardView` → `ReportsView` | Unfinished tasks carry forward cleanly across meetings with full source lineage. |

---

## Video B: Live Product Demo (60–90s)

| Scene | Timecode | Visual Composition | UI State / Component | Key Takeaway |
| :--- | :--- | :--- | :--- | :--- |
| **B1** | `00:00 - 00:12` | Recruiter Demo Bar at top (`Scenario: Q4 Business Operations Review`) + **Dashboard** charts. | `GuidedDemoController` + `DashboardView` | Instant zero-setup recruiter experience with realistic Q4 data. |
| **B2** | `00:12 - 00:25` | Selecting **Part 2: Enterprise Rollout & Handover Sync** in **Meetings** and inspecting transcript. | `MeetingsView` (`mtg-q4-ops-2`) | Full multi-speaker transcript ready for live extraction. |
| **B3** | `00:25 - 00:45` | Running AI extraction, reviewing `Unassigned` task, editing fields, and clicking **Approve & Save**. | `AIAssistantView` | Real server-side Gemini structured output + human approval workflow. |
| **B4** | `00:45 - 00:58` | Filtering tasks in **Action Items**, completing Priya's EMEA runbook task, and opening Status History modal. | `TasksView` | Full CRUD, filtering, and audit history on every action item. |
| **B5** | `00:58 - 01:12` | Carrying Marcus's overdue webhook task into Part 2 in **Carry-Forward**, then acknowledging **Work Handover**. | `CarryForwardView` + `HandoverView` | Preserves original meeting lineage and captures formal handover sign-off. |
| **B6** | `01:12 - 01:25` | Opening **Reports**, generating AI executive narrative from stored metrics, and exporting Markdown. | `ReportsView` | Live data-driven reporting with zero hardcoded numbers. |
