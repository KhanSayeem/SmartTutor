# SmartTutor Issue #64 Claude Handoff

## Current State

- Repo: `C:\Users\Hi\.codex\worktrees\64ba\SmartTutor`
- Branch: `codex/issue-64-reviews-tab`
- Base state: clean branch from merged `origin/main` after PR #74.
- Current diff before this handoff: no application code changes.
- This handoff file is the only intended committed change for the handoff commit.

## Active Issue

- GitHub issue: https://github.com/KhanSayeem/SmartTutor/issues/64
- Title: `Build Reviews tab on Tutor Profile`
- State: open
- Labels include: `status:partial`, `module:search`, `type:frontend+backend`, `week:7`, `source:ICT302 backlog`
- Acceptance criteria:
  - Shows real review data tied to completed bookings.
  - Average rating matches the profile header.
- Issue note: Reviews tab displays real reviews, but rating breakdown is incomplete.
- Figma reference: `9:134`

Keep the issue open unless the user explicitly asks to close it. If completed, update labels truthfully, normally from `status:partial` to `status:completed`, and leave the issue open.

## Required Project Rules

Read these first in the repo:

- `AGENTS.md`
- `docs/superpowers/handoffs/2026-08-07-smarttutor-figma-first-continuation.md`
- `docs/github-issue-tracker-summary.md`

Important rules:

- Figma is the source of truth for UI structure, spacing, colors, typography, and behavior.
- Figma file key: `QoW89JeNwFX7nFV7kyVbEy`
- Canonical SmartTutor Figma link: `https://www.figma.com/design/QoW89JeNwFX7nFV7kyVbEy/SmartTutor?node-id=6-2&t=dxpwo0IzVDYADcl2-0`
- Before making design decisions, use the Figma plugin/connector and inspect the relevant node.
- Do not claim Figma parity unless the relevant node was inspected in the current workflow.
- Check whether shadcn is configured before using it. At handoff time, AGENTS says shadcn is not configured: no `components.json`, no `client/src/components/ui`, and no local shadcn binary.
- If shadcn is available or deliberately added, prefer pre-made shadcn/Radix primitives and blocks wherever they fit, especially tabs/cards/progress primitives, instead of inventing custom UI blocks. Adapt them to match the SmartTutor Figma design exactly. Do not let generic shadcn styling override Figma.

## Figma Context Already Inspected

The Figma connector was used in this workflow for issue #64:

- `get_metadata` on node `9:134`
- `get_design_context` on node `9:134`
- `use_figma` inspection showing parent node `9:108` named `Tutor Profile`
- `get_design_context` on node `9:108`

Do another fresh inspection before implementing if possible, because SmartTutor rules require Figma inspection in the current workflow.

Key Figma observations:

- Node `9:134` is the profile tab bar named `Tabs`.
- Size: `1440 x 48`, white background, border `#e0e4e9`.
- Active tab in Figma is `Overview`:
  - Label at about `x=79`, `y=13`
  - Inter Semi Bold, 15px
  - Color `#2563EB`
  - Underline at about `x=79`, `y=41`, `width=88`, `height=3`, radius 2, color `#2563EB`
- Inactive tabs:
  - `Reviews` at about `x=239`, `y=13`
  - `Availability` at about `x=399`, `y=13`
  - Inter Medium, 15px, color `#6B7280`
- Parent node `9:108` is `Tutor Profile`.
- Body starts below tabs around y=332.
- Left column: x=80, width 700, white cards with 12px radius.
- Right column: x=820, width 540, booking card with 12px radius and subtle shadow.
- Profile header uses:
  - Primary blue `#2563EB`
  - Navy `#1E3A5F`
  - Muted text `#6B7280`
  - Warning rating color `#F59E0B`

## Current Code Pointers

- Main profile UI: `client/src/App.jsx`
  - `Tabs` helper around line 114.
  - `BookingWidget` starts around line 597.
  - `TutorProfilePage` starts around line 660.
  - Current Reviews tab only maps `reviews` and shows star text/comment/student name.
  - Current tab component is generic button pills, not the Figma `9:134` profile tab bar.
- Main styling: `client/src/styles.css`
  - Existing design tokens are in `:root`.
  - Search UI styles from issue #58 are already Figma-oriented.
  - No dedicated profile tab/review breakdown styles exist yet.
- Tutor API: `server/src/routes/tutors.js`
  - `GET /tutors/:id` currently returns reviews filtered only by `review.tutorId`.
  - It does not verify review booking status.
- Seed data: `server/src/data/store.js`
  - Completed booking `bk-0999` belongs to `u-student` and `u-tutor`.
  - Review `rev-1` references `bookingId: "bk-0999"` and rating `5`.
  - Tutor seed profile has stale-looking aggregate fields: `rating: 4.9`, `reviewCount: 128`, while actual seed review count is 1. Issue #64 requires the average rating to match the profile header, so decide whether to derive the header from completed-booking reviews or include response aggregates and render them consistently.

## Recommended Implementation

1. Re-check current state:
   - `git status --short --branch`
   - `gh issue view 64 --json number,title,state,body,labels,url`
   - shadcn check: `rg --files -g components.json -g '!node_modules'`, plus inspect `package.json`.

2. Re-inspect Figma:
   - Use Figma plugin/connector against file key `QoW89JeNwFX7nFV7kyVbEy`.
   - Inspect node `9:134`.
   - Inspect parent node `9:108` if needed for surrounding profile layout.

3. Backend behavior:
   - In `server/src/routes/tutors.js`, return only reviews tied to completed bookings.
   - Shape each review with the matching completed booking and public student.
   - Consider returning `reviewSummary` with:
     - `count`
     - `average`
     - `breakdown` for ratings 5, 4, 3, 2, 1
   - Ensure the profile header and Reviews tab use the same `reviewSummary.average` and `reviewSummary.count` so they match.

4. Frontend UI:
   - Replace the generic profile tab pills with a profile-specific tab bar aligned to Figma node `9:134`.
   - Keep `Overview`, `Reviews`, and `Availability`.
   - Use Figma spacing, color, typography, underline behavior, and white bordered tab bar.
   - Build the Reviews tab content:
     - Average rating summary.
     - 5-to-1 rating breakdown bars.
     - Individual review list with rating, comment, student name, booking subject/date if returned.
     - Empty state for tutors with no completed-booking reviews.
   - If shadcn is configured or deliberately added, use shadcn/Radix Tabs, Card, and Progress primitives where suitable, but restyle to match Figma exactly.

5. Visual and behavior check only, per user request:
   - Start the app if needed: `npm run dev`.
   - Visit `http://localhost:5173`.
   - Log in with existing seeded student credentials from the app/docs if needed. Do not print secrets if any real credentials are present.
   - Navigate to tutor profile for `u-tutor`, likely `/tutors/u-tutor`.
   - Check:
     - Reviews tab switches visibly.
     - Average rating in the profile header matches the Reviews tab summary.
     - Rating breakdown reflects completed-booking reviews.
     - Review list only includes review data tied to completed bookings.
     - Availability and Overview tabs still switch.
   - A quick browser screenshot is enough. The user explicitly said no thorough tests.

6. GitHub workflow:
   - Keep issue #64 open.
   - If implementation is complete, update the issue truthfully with a comment and status label.
   - Do not close it unless the user explicitly asks.

## Verification Boundary

The user asked: "no need to run thorough tests, just a visual check and also if the intended behavior is there or not."

So do not spend time on the full `npm run lint`, `npm run build`, `npm run test`, and `npm audit` set unless the user changes direction. If you skip them, state that clearly in the final response.

## Prompt For Claude

Continue SmartTutor issue #64 from branch `codex/issue-64-reviews-tab` in `C:\Users\Hi\.codex\worktrees\64ba\SmartTutor`.

First read:

- `AGENTS.md`
- `docs/superpowers/handoffs/2026-08-13-smarttutor-issue-64-claude-handoff.md`
- `docs/superpowers/handoffs/2026-08-07-smarttutor-figma-first-continuation.md`
- `docs/github-issue-tracker-summary.md`

Implement GitHub issue #64: https://github.com/KhanSayeem/SmartTutor/issues/64. The issue is open and `status:partial`. Keep it open unless explicitly told to close it.

Use the Figma plugin/connector before UI decisions. The SmartTutor Figma file key is `QoW89JeNwFX7nFV7kyVbEy`; issue #64 references node `9:134`, and the surrounding Tutor Profile screen is node `9:108`. Treat Figma as the source of truth for layout, spacing, colors, typography, and component behavior. Match the tab bar at node `9:134`: 48px white bordered bar, 80px left anchor, 160px tab spacing, Inter 15px, active blue `#2563EB`, inactive muted `#6B7280`, and 3px blue underline.

Check whether shadcn is configured before using it. If shadcn is available or you deliberately add it, use pre-made shadcn/Radix primitives and blocks wherever they fit, especially Tabs, Card, and Progress, instead of inventing custom UI blocks. Adapt them to match the SmartTutor Figma exactly. Do not let default shadcn styling override Figma.

Implement the intended behavior:

- `GET /tutors/:id` should only return/show reviews tied to completed bookings.
- The Reviews tab should show average rating, rating breakdown, and individual review list.
- The average rating shown in the profile header must match the Reviews tab summary.
- Overview and Availability tabs should keep working.

Verification requested by the user is intentionally light: perform a browser visual check plus intended-behavior smoke check only. Do not run the full thorough verification suite unless asked. If tests are skipped, say so.
