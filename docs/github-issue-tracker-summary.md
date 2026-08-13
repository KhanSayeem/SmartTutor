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

- `status:completed`: **73**
- `status:partial`: 0
- `status:todo`: 0

**The entire 73-issue backlog is now `status:completed`.** All 10 issues
open at the start of this continuation session (`#41, #47, #50, #53` from
`status:todo`, and `#11, #28, #34, #56, #57, #73` from `status:partial`)
were closed out, in that order. See each issue's comment thread on GitHub
for implementation and verification detail. Two required an explicit
decision from the repo owner rather than being silently built:

- **#41** (real-time delivery) was re-scoped from its stale "connect
  Firestore" premise to the already-tightened 1s poll interval landed in
  #53, rather than building push-based delivery (Supabase Realtime or a
  custom WebSocket layer) — the repo owner's call, made after being shown
  the tradeoff.
- **#11, #28, #34, #57** (the four issues whose completion markers named
  MongoDB/Firebase specifically) turned out to already have their actual
  functional acceptance criteria met against the app's real architecture
  (the in-memory seeded store, and Supabase-Storage-with-local-placeholder-
  fallback) — re-verified with new regression tests rather than rebuilt,
  per the repo owner's explicit decision to keep that architecture instead
  of adding real MongoDB persistence or a new cloud storage account.
- **#56** and **#73** both hit the same gap — a source document (the
  original ICT301 ERD for #56, "Section 4" of the backlog PDF for #73) that
  isn't present in this repository. Both were re-scoped, with the repo
  owner's sign-off, to complete against what's actually available (the
  as-built schema and the real Figma screen frames, respectively) rather
  than guessing at documents neither of us has read.

Along the way, verifying these surfaced and fixed two real bugs unrelated
to the re-scoping itself: a `MulterError` was crashing oversized-file
uploads with a raw 500 instead of the clean 400 every other rejected file
got, and every avatar-rendering site broke with `ERR_UNKNOWN_URL_SCHEME`
when Supabase Storage wasn't configured, instead of falling back to
initials like materials/message-attachment downloads already did.

Production is deployed and verified: backend on Render, frontend on Vercel
(both free tier). See `docs/superpowers/handoffs/2026-08-14-smarttutor-session-continuation-handoff.md`
for URLs and details. Full server test suite: 26 tests, all passing.

No open work remains in the tracker. Any further work is net-new scope
beyond the original 73-issue backlog.

