# SyncMind AI — Enterprise UI/UX Transformation Plan

## 1. Codebase Audit & Architecture Summary

### Existing Frontend & Backend Audit
- **Backend (`/server.ts` & `/src/core/engine.ts`)**:
  - Express + TypeScript backend persisting state to `data/syncmind-db.json` with automatic fallback to client `localStorage` (`src/services/api.ts`).
  - Full REST API routes: `GET /api/state`, `POST /api/reset`, `POST /api/meetings`, `PUT /api/meetings/:id`, `DELETE /api/meetings/:id`, `POST /api/ai/analyze-meeting`, `POST /api/meetings/:id/approve-analysis`, `POST /api/tasks`, `PUT /api/tasks/:id`, `PATCH /api/tasks/:id/status`, `DELETE /api/tasks/:id`, `POST /api/tasks/:id/carry-forward`, `POST /api/handovers`, `POST /api/handovers/:id/acknowledge`, `POST /api/reports/generate`, `POST /api/ai/tts`, and `POST /api/ai/chat`.
  - Automated unit test suite (`src/core/engine.test.ts` — 7 tests covering seed data, meeting CRUD, `Unassigned`/`Unspecified` AI validation, task status history, carry-forward lineage deduplication, handovers, and Copilot actions).
- **What Will Be Preserved & Upgraded**:
  - All backend API contracts, persistence, Indian team personas (**Ananya Sharma**, **Rohan Deshmukh**, **Priya Nair**), the 9-step **Guided Recruiter Demo**, the **Animated Problem & Solution Explainer**, and the **Interactive AI Copilot Chatbot** will be 100% preserved and restyled into the new enterprise design system.

---

## 2. Visual Direction & Enterprise Design System

- **Aesthetic Persona**: High-Craft Light Mode Enterprise Productivity SaaS (inspired by Linear, Asana Enterprise, and Stripe Dashboard).
- **Color Palette**:
  - **Primary Canvas**: Cool Alabaster (`#F8FAFC` / `slate-50`)
  - **Elevated Surface (Sidebar, Header, Cards, Drawers)**: Pure Crisp White (`#FFFFFF`)
  - **Glass / Floating Overlays (Command Search, Modals)**: `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(12px)`
  - **Primary Ink**: Deep Navy (`#0F172A` / `slate-900`)
  - **Secondary Body**: Slate Neutral (`#475569` / `slate-600`)
  - **Muted / Metadata**: Cool Grey (`#64748B` / `slate-500`)
  - **Primary Brand Accent**: Restrained Enterprise Indigo (`#4F46E5` / `indigo-600`, hover `#4338CA` / `indigo-700`, subtle surface tint `indigo-50/70`)
  - **AI Intelligence Accent**: Deep Violet (`#7C3AED` / `violet-600`)
  - **Semantic Status Tokens**:
    - Completed / Verified: Emerald (`#059669` / `emerald-600`)
    - Pending / Carry-Forward: Amber (`#D97706` / `amber-600`)
    - Overdue / Blocker: Crimson (`#DC2626` / `red-600`)
  - **Border Hairlines**: `1px solid #E2E8F0` (`border-slate-200`)
- **Typography & Scannable Hierarchy**:
  - Sans-serif UI hierarchy (`Inter` / system sans) with `font-mono tabular-nums` for all KPIs, dates, completion percentages, and SLA metrics.

---

## 3. Application Shell & Navigation Architecture

### Persistent Left Sidebar (`240px` desktop, collapsible drawer on mobile/tablet)
1. **Overview** (`dashboard`) — Operational command center, 6 live KPI cards, weekly activity chart, recent/upcoming meetings, priority tasks, decisions, work transfers, and animated Problem/Solution walkthrough.
2. **Meetings** (`meetings`) — Searchable & filterable meeting list + structured multi-section meeting detail workspace (Transcript, AI Summary, Key Discussion Points, Decisions, Linked Action Items, and Carry-Forward Follow-ups).
3. **AI Intelligence** (`ai-assistant`) — Source-grounded transcript processor clearly distinguishing **AI-Extracted Draft** vs. **Human-Verified Record**, with inline editing and 1-click approval.
4. **Action Items** (`tasks`) — Dual **List View** and **Kanban Board View** (`Overdue`, `Pending`, `Completed`) with owner/priority/status filters, Carry-Forward trigger, and a **Slide-Over Task Detail Drawer** showing full status & carry-forward lineage.
5. **Work Transfers** (`handover`) — Dedicated knowledge transfer & carry-forward continuity workspace displaying sender, receiver, project background, decisions made, pending tasks, blockers/open questions, and recipient acknowledgment workflow.
6. **Reports & Analytics** (`reports`) — Executive management analytics displaying meeting-to-task conversion, ownership distribution, completion velocity, follow-up lineage, date/sprint filtering, and exportable AI executive narrative.
7. **Settings** (`settings`) — Functional workspace settings including Active User Profile switcher (`Ananya Sharma`, `Rohan Deshmukh`, `Priya Nair`), AI extraction guardrails preview, workspace data export (`JSON`), and baseline demo reset.

### Top Navigation Bar (`60px` height)
- **Global Command Search (`Cmd+K` / `Ctrl+K`)**: Instant modal searching across all meetings, transcripts, action items, decisions, blockers, and work transfers with 1-click navigation.
- **Notification Center Popover**: Real-time operational alerts derived from live state (2 overdue tasks, 1 high-severity DPDP blocker, 1 pending work transfer awaiting acknowledgment) with direct drill-down links.
- **Workspace & Profile Switcher**: Shows current workspace (`Enterprise AI Delivery · Q4`) and active user avatar (`Ananya Sharma`, `Rohan Deshmukh`, or `Priya Nair`).
- **Context-Sensitive Page Action**: Dynamic primary CTA in the top bar (`+ New Meeting`, `Analyze Transcript`, `+ New Action Item`, `+ New Work Transfer`, or `Export Report`).

---

## 4. Module-by-Module Enhancements

1. **Overview Dashboard (`src/components/DashboardView.tsx`)**:
   - **6 Live KPI Cards**: Total Meetings, Meetings This Week, Open Action Items, Completed Action Items, Overdue Tasks, and Pending Work Transfers.
   - **Operational Panels**: Recent & Upcoming Meetings, Action Items Requiring Attention (with 1-click completion), Recent Decisions & Blockers, Work Transfer Activity summary, and Weekly Meeting & Execution Activity Chart.
   - **Collapsible Animated Explainer**: Clean toggle to watch or minimize the 55-second animated Problem & Solution explainer video.
2. **Meeting Management (`src/components/MeetingsView.tsx`)**:
   - Search and filter meetings by status (`AI Summary Verified` vs. `Pending Analysis`) or participant.
   - Structured detail tabs/sections: Meeting Info & Participants, Verbatim Transcript & Notes, AI-Generated Summary, Decisions & Blockers, Linked Action Items, and Carried-Forward Follow-ups.
3. **AI Intelligence (`src/components/AIAssistantView.tsx`)**:
   - Clear visual distinction between **AI-Generated Draft (Unverified)** and **Human-Confirmed Workspace Record**, plus previous meeting context panel showing unfinished tasks eligible for carry-forward.
4. **Action Item Management (`src/components/TasksView.tsx`)**:
   - **List View & Kanban View Toggle**: Switch seamlessly between a high-density enterprise table and a 3-column Kanban board (`Overdue`, `Pending`, `Completed`).
   - **Slide-Over Task Detail Drawer**: Inspect task description, source meeting link, current meeting assignment, carry-forward modal trigger, and chronological status audit log.
   - **Confirmation Modal** for task deletion.
5. **Work Transfers & Continuity (`src/components/HandoverView.tsx` & `src/components/CarryForwardView.tsx`)**:
   - Unified continuity experience allowing users to both manage **Work Handover Packages** (sender, receiver, context, decisions, pending tasks, blockers, acknowledgment) and **Carry-Forward Unfinished Tasks** across meetings without losing source lineage.
6. **Reports & Analytics (`src/components/ReportsView.tsx`)**:
   - Adds Meeting-to-Task conversion metrics, Task Ownership Distribution bars, Weekly Completion Trends, Follow-up Carry-Forward status, filterable view, and Markdown/JSON export.
7. **Command Search, Notifications & Settings (`src/components/CommandSearchModal.tsx` & `src/components/SettingsView.tsx`)**:
   - New functional modules wired directly to `AppDatabaseState`.
