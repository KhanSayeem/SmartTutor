# GitHub Issue Tracker Summary

Created from `SmartTutor_ICT302_Implementation_Backlog.pdf`.

## Current Tracker State

- Repository: `KhanSayeem/SmartTutor`
- Issues created: 73
- Open issues: 73
- Closed issues: 0

## Owner Counts

- Manish KC: 21 issues
- Rabin Malla: 19 issues
- Seonwoo Kim: 16 issues
- MD Fatinur Rahman: 17 issues

## Status Labels

- `status:completed`: implemented in the current repo, issue intentionally left open for review.
- `status:partial`: partially implemented, with acceptance criteria still open.
- `status:todo`: not implemented yet.

All issues were intentionally kept open. GitHub's native completed state is closed, so completion is represented with labels and issue-body completion markers.

## Status Snapshot (2026-08-14, end of session)

- `status:completed`: 67
- `status:partial`: 6 — `#11, #28, #34, #56, #57, #73`, all blocked on either
  the repo-wide MongoDB-persistence gap or an unavailable source document
  (original ERD/design file). See `docs/superpowers/handoffs/2026-08-14-smarttutor-session-continuation-handoff.md`
  for why each is left partial rather than force-closed.
- `status:todo`: 0. The backlog's last 4 open issues (`#47`, `#50`, `#53`,
  `#41`) were completed this session, in that order — see each issue's
  comment thread for implementation and verification detail. `#41` was
  re-scoped (with the repo owner's explicit sign-off) from its stale
  "connect Firestore" premise to the already-tightened 1s poll interval
  from `#53`, rather than building push-based delivery.

Production is deployed and verified: backend on Render, frontend on Vercel
(both free tier). See `docs/superpowers/handoffs/2026-08-14-smarttutor-session-continuation-handoff.md`
for URLs and details.

Only the 6 `status:partial` issues remain open work, and per the same
handoff doc they're intentionally not to be piecemeal-fixed — moving them
forward means a database-architecture conversation with the repo owner
first (MongoDB persistence is not wired; the app runs on an in-memory
seeded store).

