# RBAC Audit — Every Route

Walks every route in `server/src/routes/` and checks: is `requireAuth`
applied, is there a `permit(...roles)` restriction where one belongs, and —
the check that actually matters for routes gated only by "any authenticated
user" — does the handler body scope the resource to `req.user.id` rather
than trusting a client-supplied id.

Mounting order (`app.js`): `/api/auth`, `/api/admin`, `/api/tutors`,
`/api/bookings`, `/api/messages`, `/api/materials`, `/api/progress`. Every
router except `auth.js` and `tutors.js` applies `router.use(requireAuth)` at
the top; those two apply it per-route instead, correctly, since
register/login/forgot-password/reset-password and the tutor directory browse
must stay reachable without a token (or, for tutors, are `requireAuth`
per-route but not role-restricted, since browsing tutors is intended for any
signed-in account). No router is mounted with zero auth protection.

## Route-by-route

| Method | Path | requireAuth | permit(...) | Ownership check | Status |
|---|---|---|---|---|---|
| GET | /health | — | — | N/A | pass |
| POST | /auth/register | No | — | N/A | pass — intentionally public |
| POST | /auth/login | No | — | N/A | pass — intentionally public |
| POST | /auth/forgot-password | No | — | N/A | pass — doesn't leak whether the email exists |
| POST | /auth/reset-password/:token | No | — | Token-based, single-use, expiring | pass |
| GET | /auth/me | Yes | — | Operates on `req.user` only | pass |
| PATCH | /auth/me | Yes | — | Self-scoped; role-aware `.strict()` schema | pass |
| POST | /auth/me/avatar | Yes | — | Self-scoped | pass |
| GET | /admin/stats | Yes | admin | N/A | pass |
| GET | /admin/users | Yes | admin | N/A | pass |
| PATCH | /admin/users/:id | Yes | admin | Self-lock guard (can't demote/disable self) | pass |
| GET | /admin/transactions | Yes | admin | N/A | pass |
| GET | /admin/reports | Yes | admin | N/A | pass |
| GET | /tutors | Yes | — | N/A — public marketplace listing | pass |
| GET | /tutors/:id | Yes | — | N/A for tutor fields | **was fail — fixed, see below** |
| GET | /tutors/:id/availability | Yes | — | N/A — non-sensitive slot data | pass |
| GET | /bookings | Yes | — | Filtered by `req.user.role`/id | pass |
| POST | /bookings | Yes | student | `studentId` set server-side from `req.user.id` | pass |
| PATCH | /bookings/:id/accept | Yes | tutor | `booking.tutorId !== req.user.id` → 403 | pass |
| PATCH | /bookings/:id/reject | Yes | tutor | Same tutor-ownership check | pass |
| PATCH | /bookings/:id/cancel | Yes | — | `assertParticipant` (either party, or admin) | pass |
| PATCH | /bookings/:id/reschedule | Yes | — | `assertParticipant` | pass |
| PATCH | /bookings/:id/complete | Yes | tutor, admin | Tutor-ownership check; admin bypasses correctly | pass |
| GET | /materials | Yes | — | admin: all, tutor: own uploads, student: public/linked | pass |
| POST | /materials | Yes | tutor | `uploaderId` set server-side | pass |
| DELETE | /materials/:id | Yes | tutor, admin | Uploader-ownership check; admin bypasses correctly | pass |
| GET | /materials/:id/download | Yes | — | Inline: admin / uploader / public / linked | pass |
| GET | /messages/contract | Yes | — | N/A — static schema info | pass |
| GET | /messages/conversations | Yes | — | Filtered by `participantIds.includes(req.user.id)` | pass |
| GET | /messages/conversations/:id/messages | Yes | — | Participant check → 403 | pass |
| POST | /messages/conversations/:id/messages | Yes | — | Participant check; `senderId` set server-side | pass |
| GET/POST | /messages/conversations/:id/typing | Yes | — | Participant check | pass |
| POST | /messages/messages/:id/flag | Yes | — | Participant check via the message's conversation | pass |
| GET | /messages/flagged | Yes | admin | N/A | pass |
| GET | /progress/student | Yes | student | Filtered by `booking.studentId === req.user.id` | pass |
| GET | /progress/earnings | Yes | tutor | Filtered by `transaction.tutorId === req.user.id` | pass |
| GET | /progress/invoices | Yes | student | Filtered by `transaction.studentId === req.user.id` | pass |
| GET | /progress/invoices/:id/download | Yes | student | Role permit *and* an ownership filter, both present | pass |

## Confirmed gap — found and fixed

**Student PII leaked through the public tutor-profile reviews list.**
`GET /tutors/:id` shaped each review's author with `store.userPublic()`,
which strips only `passwordHash` — email, phone, subjects, and joinedAt all
stayed in. This route requires only `requireAuth`; it does not check any
relationship between the viewer and the review's author. Any authenticated
account — a student who has never interacted with the tutor, or another
tutor entirely — could browse any tutor's public profile and read the email
address and phone number of every student who had ever left a review on
that tutor.

Verified the exploit directly: logged in as `liam@smarttutor.local` (a
student unrelated to the review being read), fetched `u-tutor`'s profile,
and confirmed the response included `student@smarttutor.local` and
`+61 400 000 101` for a review written by a different student.

**Fix:** added `store.reviewerPublic(user)`, a minimal shape
(`{id, name, avatar, avatarUrl}`) for exactly this "rendered to an
unrelated, authenticated audience" case, and switched `tutors.js` to use it
for review authors. Re-verified as the same unrelated student — the response
now contains only `{id, name, avatar}`. Confirmed the client only ever reads
`name`/`avatar`/`avatarUrl` off `review.student` (via the shared `Avatar`
component), so nothing broke.

## No other confirmed gaps

Every `permit(...)`-restricted route was checked for an accompanying
resource-ownership assertion in the handler body, not just the role check —
all of them had one, including the two admin-bypass cases (`complete`,
`DELETE materials`), which correctly skip the ownership check for admins
while still enforcing it for the restricted role. Every "any authenticated
user" route was checked for real `req.user.id`-based scoping in the handler,
and all were properly scoped.
