# SmartTutor As-Built Data Schema

This documents every collection actually implemented in the running app, read
directly from `server/src/data/store.js` and the routes that mutate it. It is
current as of commit `2ea69de` on `codex/issue-64-reviews-tab`.

## Storage reality

**This is not MongoDB today.** Every collection below is a plain JavaScript
array (or `Map`, for two of them) held in server memory, exported as a single
`store` object and mutated in place by the route handlers. `mongoose` is a
listed dependency and `server/src/services/database.js` is the intended
connection point, but `MONGODB_URI` is unset and nothing calls it — the
process holds the only copy of the data, and a restart resets it to the
seeded fixtures. This is documented as a known gap since the first handoff
and is unchanged here; this document describes the schema as it actually
behaves, not the schema MongoDB will eventually enforce.

File uploads (avatars, materials) go through `server/src/services/storage.js`,
which uploads to **Supabase Storage** when configured, or a local placeholder
when not — see `docs/supabase-storage-setup.md`. Firebase was the originally
specified target; it was replaced with Supabase per direction to use free
tooling only.

## Collections

### `users`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `u-<slug>` for seeded rows, `u-<nanoid8>` for registered ones |
| `name` | string | |
| `email` | string | Login identity. Case-insensitively unique via `findUserByEmail` |
| `passwordHash` | string | bcrypt. Stripped from every API response by `userPublic()` |
| `role` | `"student" \| "tutor" \| "admin"` | |
| `active` | boolean | `false` blocks login (403) and every authenticated request (401), via `requireAuth` |
| `avatar` | string | 2-letter initials fallback, always present |
| `avatarUrl` | string, optional | Set by `POST /auth/me/avatar`. Supabase public URL or unset |
| `avatarPath` | string, optional | Storage path companion to `avatarUrl` |
| `joinedAt` | date string | |
| `phone` | string, optional | Student/tutor only |
| `subjects` | string[] | Student and tutor |
| `languages` | string[], tutor only | |
| `price` | number, tutor only | Hourly rate |
| `verified` | boolean, tutor only | |
| `bio` | string, tutor only | |
| `qualifications` | string[], tutor only | |
| `availabilitySummary` | string, tutor only | Free text, distinct from the `availability` collection |
| `rating` | number, **derived, not stored** | Injected by `userPublic()` from `reviewSummary()`. See Reviews below |
| `reviewCount` | number, **derived, not stored** | Same source |

`PATCH /auth/me` validates against a role-aware zod schema (`.strict()`) so a
student cannot write tutor-only fields, and role/`active`/`id` can never be
set through this endpoint. `PATCH /admin/users/:id` is the only path that can
change `role`/`active`, and it refuses to let an admin change their own.

### `availability`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `slot-<n>` |
| `tutorId` | string | FK → `users.id` |
| `date` | `YYYY-MM-DD` | |
| `startTime` / `endTime` | `HH:MM` | |
| `mode` | `"Online" \| "In-Person"` | |
| `booked` | boolean | Flipped by booking create/cancel/reject/reschedule |

One slot represents one bookable session. `booked` is the only state; there
is no separate "held" state during checkout — a slot is claimed the instant
`POST /bookings` succeeds.

### `bookings`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `bk-<n>` seeded, `bk-<nanoid8>` created |
| `reference` | string | `ST-<n>`. See `nextReference()` below |
| `studentId` / `tutorId` | string | FK → `users.id` |
| `subject` | string | Free text, not FK'd to `users.subjects` |
| `date`, `startTime`, `endTime`, `mode` | — | Copied from the `availability` slot at booking time; the slot itself is not referenced afterward |
| `amount` | number | Copied from `tutor.price` at booking time |
| `status` | `"pending" \| "confirmed" \| "completed" \| "cancelled"` | State machine below |
| `notes` | string, optional | Tutor session notes, set on `/complete` |
| `cancellationReason` | string, optional | Set on `/reject` and `/cancel` |
| `reminderSentAt` | ISO datetime, optional | Set once by the reminder scheduler; prevents duplicate sends |
| `createdAt` | ISO datetime | |

**State machine:** `pending` →(`tutor` accepts)→ `confirmed` →(`tutor`/`admin`
completes)→ `completed`. `pending` →(`tutor` rejects)→ `cancelled`.
`pending`/`confirmed` →(participant cancels)→ `cancelled`. Reschedule moves a
`pending` or `confirmed` booking to a new slot and resets it to `pending`
(needs re-confirmation).

`nextReference()` takes the highest existing `ST-<n>` and increments — not a
count of bookings, which would repeat once the list is filtered or trimmed.

### `transactions`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `txn-<n>` |
| `bookingId` | string | FK → `bookings.id`, one-to-one in practice |
| `studentId` / `tutorId` | string | FK → `users.id`. Denormalized off the booking, not re-derived |
| `subject` | string | Denormalized off the booking |
| `amount` | number | |
| `status` | string | Only ever `"paid"` — see note below |
| `createdAt` | ISO datetime | |

**A transaction is only ever created already `status: "paid"`, at the moment
a booking is marked completed** (`PATCH /bookings/:id/complete`, one
transaction per booking, guarded against duplicates). There is no
pending/refunded/failed state anywhere in the code. Anywhere the UI needs a
"pending payout" concept (the tutor Earnings dashboard), it is computed from
`confirmed`-but-not-yet-`completed` bookings instead — a real number, but
explicitly **not** sourced from this collection, and documented as such in
that route.

### `conversations`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `conv-1` seeded, `conv-<nanoid8>` created |
| `participantIds` | string[2] | Always exactly 2, deduplicated and sorted by `createConversation()` |
| `bookingId` | string, nullable | FK → `bookings.id`. One conversation per (participant-pair, booking) |
| `unreadBy` | string[] | Subset of `participantIds` |
| `updatedAt` | ISO datetime | Bumped on every new message |

`createConversation(participantIds, bookingId)` is the only way a
conversation is created, called from the booking-accept path. It matches an
existing conversation **by booking id AND exact participant set** first, then
falls back to an unbound (no `bookingId`) conversation with the same exact
participant set, and only creates a new row if neither exists. (This was
previously an `OR` of the two conditions, which let one participant-pair's
first thread absorb every later booking between the same two people —
fixed in this branch, see commit `28505e1`.)

### `messages`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `msg-<n>` seeded, `msg-<nanoid8>` created |
| `conversationId` | string | FK → `conversations.id` |
| `senderId` | string | FK → `users.id`, must be a participant |
| `body` | string | |
| `attachments` | array, currently always `[]` | Accepted by the API shape but no upload path produces one yet — file attachments are issue #47 |
| `flagged` | boolean | |
| `flagReason` | string, optional | Set with `flagged` |
| `createdAt` | ISO datetime | |

Paginated by cursor (`?before=<messageId>`), not offset, so scroll-up paging
is stable while new messages arrive. `store.messages` is a single flat array
across all conversations; there is no per-conversation shard.

### `materials`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `mat-<n>` seeded, `mat-<nanoid8>` created |
| `title` | string | Defaults to the uploaded filename |
| `mimeType` | string | One of PDF/DOCX/PNG/MP4, enforced by `validateUpload()` |
| `size` | number, bytes | Capped at 50MB |
| `uploaderId` | string | FK → `users.id`, tutor only |
| `linkedStudentIds` | string[] | FK → `users.id`. Ignored when `public` is true |
| `public` | boolean | When true, visible to every student regardless of `linkedStudentIds` |
| `storagePath` | string | Path within the storage bucket |
| `url` | string | Supabase public URL, or a `smarttutor://` placeholder when Storage is unconfigured |
| `createdAt` | ISO datetime | |

### `reviews`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `rev-<n>` |
| `tutorId` / `studentId` | string | FK → `users.id` |
| `bookingId` | string | FK → `bookings.id`. A review not tied to a **completed** booking is filtered out everywhere it's read |
| `rating` | number, 1-5 | |
| `comment` | string | |
| `createdAt` | date string | |

**A review only counts if its booking is completed.** `tutorReviews(tutorId)`
and the student-progress "average rating given" both filter on
`booking.status === "completed"` at read time — a review can exist in the
array against a `pending` booking (there's a deliberate fixture, `rev-5`,
proving this filter works) but it never surfaces anywhere. `reviewSummary()`
computes `{count, average, breakdown}` from that filtered set, and
`userPublic()` injects it onto every tutor as `rating`/`reviewCount` — those
two fields are **never written directly to a user record**, only computed on
read, so the profile header and the Reviews tab can never disagree.

### `presence` (`Map<userId, {online, updatedAt}>`)

Not a persisted collection — an in-memory, per-process cache. `markSeen()` is
called by `requireAuth` on every authenticated request, from every router.
`isOnline()` derives online/offline from `Date.now() - updatedAt <=
presenceWindowMs` (12 seconds) rather than trusting a stored boolean, so it
can never go stale the way a written `online: true` field would. Resets on
process restart; not shared across multiple server instances.

### `typing` (`Map<"conversationId:userId", timestampMs>`)

Same shape of cache as presence, 5-second window. Written by
`POST /messages/conversations/:id/typing`, read by the paired `GET`.

### `resetTokens`

| Field | Type | Notes |
|---|---|---|
| `token` | string | nanoid(32), used as the lookup key, not a document id |
| `userId` | string | FK → `users.id` |
| `used` | boolean | |
| `expiresAt` | epoch ms | 1 hour from creation |

Cleared for a user each time a new one is requested (`store.resetTokens =
store.resetTokens.filter(...)` before pushing), so only the most recent reset
link for a given account is ever valid.

## Relationships at a glance

```
users (1) ──< availability (tutorId)
users (1) ──< bookings (studentId, tutorId) ──< transactions (bookingId, 1:1)
                                              │
                                              └──< reviews (bookingId)  [counted only if booking.status = completed]
users (2) ──< conversations (participantIds)  ──< messages (conversationId)
                    ▲
                    └── bookingId (optional, at most one active binding per participant pair)
users (1) ──< materials (uploaderId) ──< linkedStudentIds >── users (N)
users (1) ──< resetTokens (userId)
```

Nothing in this app is many-to-many except `materials.linkedStudentIds`
(array of ids, no join table since there is no relational database yet) and
`conversations.participantIds` (fixed at 2 today, but stored as an array
rather than two named fields for exactly that reason).

## Differences from the original ICT301 ERD

**Not available for comparison.** The original ICT301 ERD is not present in
this repository, and I have not seen it — the backlog PDF
(`SmartTutor_ICT302_Implementation_Backlog.pdf`) that drove the rest of this
project's seed data and issue tracker is the only source document I have
access to. If you can supply the ERD (file, image, or pasted description),
I'll produce the actual field-by-field diff this criterion asks for. Until
then, this section stays open rather than guessing at differences from a
document I've never read.
