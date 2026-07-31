# SmartTutor

SmartTutor is an ICT302 implementation of the tutor marketplace backlog:
authentication, role-gated portals, booking, messaging, materials, tutor search,
progress, earnings, invoices, and admin management.

## Tech Stack

- React 18 + Vite
- Local browser router, TanStack Query, Zustand
- Tailwind CSS with the Figma-derived token system
- Node.js + Express
- JWT auth, bcrypt password hashing
- MongoDB/Mongoose-ready backend with a seeded local in-memory store for demos

## Getting Started

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on
`http://localhost:4000`.

Seeded demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@smarttutor.local` | `Password123!` |
| Tutor | `tutor@smarttutor.local` | `Password123!` |
| Admin | `admin@smarttutor.local` | `Password123!` |

## Environment

Copy `.env.example` files in `client/` and `server/` when configuring hosted
deployments. The local demo works without external services.

## Notes

The backend exposes production-shaped endpoints and keeps all role and file
validation in shared helpers. Firebase Storage and Firestore integrations are
represented by adapter boundaries so real project credentials can be connected
without changing the UI contracts.
