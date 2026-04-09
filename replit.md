# FinanceHub - Financial Dashboard Application

## Overview

FinanceHub is a comprehensive financial dashboard application that aggregates and displays data from multiple financial accounts including credit cards, bank accounts, and investment accounts. The application uses Plaid integration for secure account connections and provides real-time monitoring, utilization analytics, and payment tracking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching
- Tailwind CSS with shadcn/ui component library (New York style variant)

**Design Patterns:**
- Component-based architecture with reusable UI components in `/client/src/components/ui`
- Custom hooks for shared logic (`use-mobile`, `use-toast`)
- Centralized API client with automatic error handling in `queryClient.ts`
- Type definitions shared between frontend and backend via `@shared` alias

**Key Features:**
- Dashboard with summary tiles for checking, savings, investment, and credit accounts
- Credit utilization breakdown by institution with color-coded indicators
- Upcoming payment tracking panel
- Account table with filtering, search, favoriting, and actions menu
- Account favoriting system (star icon) with database persistence and sorting
- Dropdown actions menu per account (View Details, Edit Account, Delete Account)
- Modal-based flows for Plaid integration and manual account entry

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Drizzle ORM for database operations
- Neon serverless PostgreSQL database
- WebSocket support for Neon connection pooling

**Design Patterns:**
- RESTful API design with route handlers in `/server/routes.ts`
- Repository pattern implemented via storage interface in `/server/storage.ts`
- Service layer for third-party integrations (Plaid service)
- Middleware for request logging and JSON body parsing

**API Endpoints:**
- `GET /api/accounts` - Retrieve user accounts
- `GET /api/accounts/summary` - Get account summary statistics
- `GET /api/payments/upcoming` - Fetch upcoming credit card payments
- `PATCH /api/accounts/:id/favorite` - Toggle account favorite status
- `POST /api/plaid/link-token` - Generate Plaid Link token
- `POST /api/plaid/exchange-token` - Exchange public token for access token
- `GET /api/alerts` - Retrieve user alerts
- `POST /api/alerts` - Create new alert
- `PATCH /api/alerts/:id` - Update alert (toggle active status)
- `DELETE /api/alerts/:id` - Delete alert
- `GET /api/alerts/triggered` - Get triggered alerts for notifications
- `PATCH /api/alerts/triggered/:id/read` - Mark triggered alert as read
- `POST /api/alerts/check` - Manually trigger alert checking (for testing)
- `POST /api/accounts/refresh` - Refresh all Plaid-linked account balances
- `POST /api/accounts/bulk-update-balances` - Bulk update manual account balances

### Database Schema

**Core Tables:**
- `users` - User authentication and profile data
- `accounts` - Financial account records with balances and metadata (includes isFavorite flag)
- `institutions` - Financial institution information (name, logo, branding)
- `plaid_items` - Plaid connection tracking with access tokens
- `transactions` - Transaction history for accounts
- `credit_card_payments` - Credit card payment schedules
- `alerts` - User-configured alert rules (balance_threshold, due_date, utilization_spike)
- `triggered_alerts` - Alert history and in-app notifications

**Account Types:**
- Checking, Savings, Investment, Credit (enum-based)
- Subtypes: checking, savings, 401k, IRA, brokerage, credit_card, line_of_credit

**Key Design Decisions:**
- UUID primary keys for distributed scalability
- Decimal type for financial amounts (precision: 12, scale: 2)
- Soft delete capability via `isActive` flag
- Manual vs. automated account tracking via `isManual` flag
- Timestamps for data freshness tracking

### External Dependencies

**Plaid Integration:**
- Plaid API for secure financial account aggregation
- Sandbox environment configured for development
- Link token creation for OAuth-style account connection
- Products enabled: Transactions
- Automatic account syncing with cursor-based updates
- Institution metadata retrieval (logos, colors, URLs)

**UI Component Library:**
- shadcn/ui (Radix UI primitives with Tailwind styling)
- Components: Dialog, Button, Input, Select, Form, Toast, Tooltip, Card, Table, etc.
- Custom theming with CSS variables for light/dark mode support
- Accessible components following WAI-ARIA standards

**Development Tools:**
- Replit-specific plugins for dev banner and cartographer (dev mode only)
- Runtime error overlay for better DX
- Hot module replacement via Vite

**Database & Storage:**
- Neon Serverless PostgreSQL with WebSocket connection pooling
- Drizzle Kit for schema migrations
- Environment-based database URL configuration

**Form Validation:**
- Zod schema validation
- React Hook Form with Zod resolver integration
- Type-safe form handling with auto-generated insert schemas from Drizzle

**State Management:**
- TanStack Query for server state with automatic refetching disabled
- Query invalidation on mutations for data consistency
- Client-side credentials included for session management

### Alerts and Notifications System

**Alert Types:**
- **Balance Threshold**: Triggers when account balance falls below specified amount
- **Utilization Spike**: Triggers when credit utilization exceeds specified percentage
- **Due Date Reminder**: Triggers specified days before payment due date

**Components:**
- `AlertService` (server/alert-service.ts): Background service that checks alert conditions
- Alert management UI (/alerts page): Create, edit, delete, and toggle alerts
- Notification bell (header): Displays triggered alerts with badge counter
- Notification popover: Shows triggered alerts with mark-as-read functionality

**Features:**
- User-scoped alert checking with deduplication (1-hour cooldown)
- In-app notifications with auto-refresh (30-second intervals)
- Alert type-specific validation (ensures required threshold values)
- Authorization checks on alert modifications

**Current Limitations:**
- Hardcoded user ID ("user-1") for demo purposes - production requires proper authentication
- Plaid credentials included in code (should be environment variables)
- No session management implementation yet
- Missing authentication/authorization layer
- Alert form validation has edge cases with default values (alerts can be created via API successfully)
- Email notifications configured but not yet implemented (in_app only)