# Camera & Screen Recording Shot List — SyncMind AI

| Shot # | Module / Route Tab | Target Element / Test ID | Action to Record | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Shot 01** | `Dashboard` | `[data-testid="recruiter-demo-bar"]` | Establish the scenario banner (`Scenario: Q4 Business Operations Review`) and the **Start Guided Demo** CTA. | `5s` |
| **Shot 02** | `Dashboard` | `[data-testid="dashboard-view"]` | Pan across the 4 KPI cards (`Total Meetings: 2`, `Open Action Items: 4`, `Completed Tasks: 1`, `Overdue Tasks: 2`) and the Weekly Velocity chart. | `7s` |
| **Shot 03** | `Meetings` | `[data-testid="meetings-view"]` | Click **Q4 Business Operations Review — Part 2: Enterprise Rollout & Handover Sync** and scroll through `[data-testid="meeting-transcript-box"]`. | `10s` |
| **Shot 04** | `AI Assistant` | `[data-testid="run-ai-analysis-btn"]` | Click **Run AI Meeting Analysis** and capture the loading spinner transitioning into `[data-testid="ai-review-panel"]`. | `10s` |
| **Shot 05** | `AI Assistant` | `[data-testid="ai-review-panel"]` | Highlight the extracted decisions and action items, showing `Unassigned` and `Unspecified` fields highlighted in amber for human review. | `8s` |
| **Shot 06** | `AI Assistant` | `[data-testid="approve-save-analysis-btn"]` | Click **Approve & Save to Meeting** and show the green confirmation banner `[data-testid="ai-approval-success"]`. | `6s` |
| **Shot 07** | `Action Items` | `[data-testid="tasks-view"]` | Click `Pending` filter, mark *"Publish onboarding runbook for EMEA enterprise support escalation"* as **Completed**, and open its Status History modal. | `10s` |
| **Shot 08** | `Carry-Forward` | `[data-testid="carry-btn-task-2"]` | Click **Carry Forward to Meeting** on `task-2` and show the new entry in the **Carry-Forward Lineage Log** (`[data-testid="carry-forward-count"]`). | `9s` |
| **Shot 09** | `Work Handover` | `[data-testid="ack-handover-hnd-1"]` | Click **Acknowledge Handover as Priya Nair** and show the status changing to `Acknowledged` with timestamp. | `5s` |
| **Shot 10** | `Reports` | `[data-testid="reports-view"]` | Show the updated KPI counters (`Completed`, `Carried Forward`, `Decisions Logged`), click **Refresh AI Executive Narrative**, and click **Export Markdown**. | `10s` |
