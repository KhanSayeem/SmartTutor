# SmartTutor Implementation Notes

Built from `SmartTutor_ICT302_Implementation_Backlog.pdf`, prepared 28 July
2026.

## Delivered Scope

- Figma-derived token system in Tailwind and global CSS.
- Public landing, register, login, admin login, reset password, portal select.
- Shared authenticated top nav and profile dropdown.
- Student routes for search, tutor profile, booking, bookings, messages,
  progress, and invoices.
- Tutor routes for dashboard, materials, earnings, messages, and profile.
- Admin dashboard for overview stats, user management, payments, and reports.
- Express API for auth, RBAC, admin, tutors, bookings, conversations, materials,
  progress, invoices, and transactions.
- Seeded local store for immediate demo use.

## Production Integration Points

- `server/src/services/database.js` is the place to enable MongoDB Atlas.
- `server/src/services/storage.js` is the place to wire Firebase Storage.
- `server/src/services/mailer.js` defaults to console/dev behavior and supports
  SMTP configuration through environment variables.
- `server/src/services/realtime.js` documents the Firestore contract used by the
  messaging UI.

## Demo Credentials

- `student@smarttutor.local` / `Password123!`
- `tutor@smarttutor.local` / `Password123!`
- `admin@smarttutor.local` / `Password123!`
