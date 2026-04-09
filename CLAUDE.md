# FinanceHub

Financial dashboard application that aggregates data from multiple financial accounts (credit cards, bank accounts, investments) using Plaid integration.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query, Tailwind CSS, shadcn/ui (New York style)
- **Backend**: Express.js, TypeScript, Drizzle ORM, Neon serverless PostgreSQL
- **Validation**: Zod schemas (shared between client and server via `drizzle-zod`)
- **External**: Plaid API for financial account aggregation

## Project Structure

```
client/src/          # React frontend
  pages/             # Route pages (dashboard, alerts, collections, analytics)
  components/ui/     # shadcn/ui components
  components/dashboard/  # Dashboard-specific components
  hooks/             # Custom React hooks
  lib/               # Utilities, query client, types
server/              # Express backend
  routes.ts          # API route handlers
  storage.ts         # Data access layer (repository pattern)
  db.ts              # Neon database connection
  alert-service.ts   # Background alert checking
  services/plaid.ts  # Plaid API integration
shared/
  schema.ts          # Drizzle ORM table definitions + Zod insert schemas
```

## Commands

- `npm run dev` — Start development server (port 5000)
- `npm run build` — Build client (Vite) and server (esbuild)
- `npm run check` — TypeScript type checking
- `npm run db:push` — Push schema changes to database

## Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

## Key Patterns

- **Database**: Drizzle ORM with PostgreSQL enums, UUID primary keys, `decimal(12,2)` for financial amounts
- **Data fetching**: TanStack Query with query invalidation on mutations
- **API**: RESTful endpoints in `server/routes.ts`, repository pattern via `server/storage.ts`
- **Forms**: React Hook Form + Zod resolver
- **Routing**: Wouter (lightweight, not React Router)
- **Components**: shadcn/ui with Radix UI primitives

## Environment

- `DATABASE_URL` — PostgreSQL connection string (required)
- `PLAID_CLIENT_ID`, `PLAID_SECRET` — Plaid API credentials
- `PORT` — Server port (default: 5000)

## Notes

- User ID is hardcoded to `"user-1"` for demo purposes (no auth layer yet)
- No test suite or linting configuration exists
- ES modules (`"type": "module"` in package.json)
