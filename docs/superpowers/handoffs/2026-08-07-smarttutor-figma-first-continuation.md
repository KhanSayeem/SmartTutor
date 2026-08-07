# SmartTutor Figma-First Continuation Handoff

Date: 2026-08-07
Repo: `C:\Users\Hi\Documents\GitHub\Miscellanious\SmartTutor`
Remote: `https://github.com/KhanSayeem/SmartTutor.git`

## Purpose

Use this handoff to continue SmartTutor work from the committed repo and GitHub issue tracker without losing the design-source contract.

## Current State

- Initial full-stack SmartTutor app is committed and pushed.
- Latest progress commit before this handoff: `bbb6a71 Document SmartTutor tracker and design rules`.
- Initial implementation commit: `a117b8b Implement SmartTutor backlog app`.
- GitHub tracker has 73 open issues created from `SmartTutor_ICT302_Implementation_Backlog.pdf`.
- Issues are intentionally open. Completion is represented with labels:
  - `status:completed`: 30
  - `status:partial`: 27
  - `status:todo`: 16
- Owner label counts:
  - `owner:Manish KC`: 21
  - `owner:Rabin Malla`: 19
  - `owner:Seonwoo Kim`: 16
  - `owner:MD Fatinur Rahman`: 17

See `docs/github-issue-tracker-summary.md` for the tracker summary.

## Hard Design Contract

Before implementing or revising UI, inspect the relevant SmartTutor Figma node first.

- Figma file key: `QoW89JeNwFX7nFV7kyVbEy`
- Canonical link: https://www.figma.com/design/QoW89JeNwFX7nFV7kyVbEy/SmartTutor?node-id=6-2&t=dxpwo0IzVDYADcl2-0
- Verified in this session through the Figma connector:
  - Node `6:2` resolves to `Landing Page`.
  - `get_metadata` returned the Landing Page hierarchy.
  - `get_design_context` returned React/Tailwind design context and screenshot for node `6:2`.
- Do not invent new screen layouts when the Figma file already contains the screen.
- Treat the PDF token summary as orientation only. The live Figma file is the source of truth for UI structure, spacing, colors, typography, component layout, and visual states.
- Do not claim Figma parity unless the relevant Figma node was inspected in the current workflow.

This rule is also recorded in `AGENTS.md`.

## shadcn Status

shadcn is not currently available/configured in this repo.

Verified local state:

- No root `components.json`.
- No `client/components.json`.
- No `client/src/components/ui`.
- No local `node_modules/.bin/shadcn.cmd`.
- No shadcn dependency appears in `client/package.json`.

Future UI work should:

- Check shadcn availability again before using it.
- If shadcn is installed later, prefer shadcn/Radix primitives or blocks where they fit the SmartTutor Figma design.
- Do not let a generic shadcn block override the exact SmartTutor Figma design.

## Implementation Reality

Do not call the app production-complete.

Implemented local/demo surface includes:

- React/Vite frontend and Express backend monorepo.
- Local browser router, TanStack Query, Zustand, Tailwind.
- Auth, RBAC, seeded login/register/reset, role-gated portals.
- Student search/profile/booking/messages/progress/invoices.
- Tutor dashboard/materials/earnings/messages.
- Admin stats/users/payments/reports.
- Seeded in-memory data store.
- Node built-in test runner with Supertest.

Known gaps that remain open in issues:

- MongoDB Atlas persistence is not wired.
- Firebase Firestore real-time messaging is not wired.
- Firebase Storage upload persistence is not wired.
- Scheduled booking reminders are not implemented.
- Deployment to Render/Railway/Netlify/Vercel is not done.
- Formal Figma-by-screen validation is not done except for node `6:2` verification in this handoff session.
- Formal mobile/accessibility passes and production smoke tests are not done.

## Verification Baseline

Previously verified after implementation:

```powershell
npm run lint
npm run build
npm run test
npm audit
```

At that time, audit returned 0 vulnerabilities and tests passed. Re-run these after any dependency or code change.

Local demo:

```powershell
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend health: `http://localhost:4000/health`

Demo accounts:

- Student: `student@smarttutor.local` / `Password123!`
- Tutor: `tutor@smarttutor.local` / `Password123!`
- Admin: `admin@smarttutor.local` / `Password123!`

## Suggested Next Work

1. Pick one open `status:partial` or `status:todo` issue from GitHub.
2. Before editing UI, inspect the exact Figma node cited in the issue body.
3. If a component exists in Figma, match it. If it does not, use `AGENTS.md` token rules and document the gap in the issue.
4. Check whether shadcn is now configured. If not, either add it deliberately or keep local components aligned to Figma.
5. Implement narrowly against the issue acceptance criteria.
6. Run `npm run lint`, `npm run build`, `npm run test`, and `npm audit`.
7. Update the GitHub issue with what is actually complete. Do not close issues unless explicitly asked.

## Suggested Skills

- `figma:figma-use` when inspecting or modifying the Figma file programmatically.
- `figma:figma-design-to-code` for future screen implementation from Figma nodes.
- `frontend-design:frontend-design` or `design-taste-frontend` for UI quality review after Figma-based implementation.
- `handoff` for repo-local continuation notes. For SmartTutor, save handoffs under `docs/superpowers/handoffs/`, not temp.
- `github:github` when managing issue state, labels, comments, or PRs.

## Handoff Rules For Future Sessions

- Read `AGENTS.md` before edits.
- Read this handoff before continuing.
- Re-check live GitHub issue state before changing labels or claiming completion.
- Re-check live Figma node context before UI work.
- Preserve unrelated user changes in the worktree.

