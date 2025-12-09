# Trogern Admin Dashboard

A comprehensive founder/admin dashboard for the Trogern Logistics SaaS platform. Built with Next.js 15, TypeScript, and Firebase.

## Architecture

```
/trogern-monorepo
├── /admin-dashboard       # Next.js 15 admin dashboard
│   ├── /app              # App router pages and API routes
│   ├── /components       # Reusable UI components
│   └── /lib              # Utilities and configurations
├── /packages
│   └── /domain           # Shared domain logic and types
└── /dashboard-api        # Existing Node.js backend (not modified)
```

## Features

### 1. Overview Dashboard
- Key metrics (signups, active users, MRR)
- Real-time activity feed
- Quick action shortcuts
- System alerts

### 2. Company Management
- List all companies with search and filters
- Company detail view with tabs:
  - Overview (stats, info, subscription)
  - Users (list and manage)
  - Activity (recent events)
  - Actions (suspend, reinstate, delete)
- Suspend/reinstate entire companies
- View company-wide metrics

### 3. User Management
- List all users across companies
- User detail view with:
  - Profile information
  - Company association
  - Recent events
  - Support tickets
  - Audit logs
- Suspend/reinstate individual users
- Password reset
- Force logout

### 4. Subscription Management
- List all subscriptions
- Filter by status and plan
- Change plans
- Cancel/reactivate subscriptions
- Apply free trials
- MRR tracking

### 5. Support Tickets
- List tickets with priority and status
- Ticket detail view with:
  - Message thread
  - Internal notes
  - Customer info
  - Status management
- Reply to customers
- Add internal notes

### 6. Analytics
- Feature usage stats
- Conversion funnel
- User retention metrics
- Daily event charts

### 7. Notifications
- Real-time notification feed
- Filter by read/unread
- Mark as read
- Delete notifications

### 8. Settings
- Profile management
- Security settings (password, 2FA)
- Notification preferences
- Admin user management

## Tech Stack

- **Framework**: Next.js 15 (App Router, RSC)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth with custom claims
- **Icons**: Lucide React

## Brand Colors

```css
/* Primary - Navy Graphite Blue */
--navy-900: #0A2A43;

/* Secondary - Electric Blue */
--electric-500: #1473E6;

/* Support Colors */
--success-500: #1FAA59;
--warning-500: #FFB020;
--error-500: #D64545;
--info-500: #4DA8DA;
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore and Auth enabled

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp admin-dashboard/.env.example admin-dashboard/.env.local
```

3. Configure Firebase credentials in `.env.local`

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001)

## Domain Package

The `@trogern/domain` package contains all shared business logic:

### Types
- `Company`, `AppUser`, `AdminUser`
- `Subscription`, `Plan`
- `SupportTicket`, `SupportMessage`
- `Event`, `Notification`, `AuditLog`

### Functions

#### Companies
```typescript
getCompaniesPage(params)
getCompanyDetail(companyId)
suspendCompany(companyId, adminUser, reason?)
reinstateCompany(companyId, adminUser)
deleteCompany(companyId, adminUser, reason?)
```

#### Users
```typescript
getUsersPage(params)
getUserDetail(userId)
suspendUser(userId, adminUser, reason?)
reinstateUser(userId, adminUser)
triggerPasswordReset(userId, adminUser)
forceLogout(userId, adminUser)
```

#### Subscriptions
```typescript
getSubscriptionsPage(params)
getSubscriptionDetail(subscriptionId)
changePlan(subscriptionId, newPlanId, adminUser)
cancelSubscription(subscriptionId, adminUser, immediate?)
applyFreeTrial(companyId, trialEndDate, adminUser, planId?)
```

#### Support
```typescript
getSupportTicketsPage(params)
getSupportTicketDetail(ticketId)
postTicketMessage(ticketId, message, adminUser)
postInternalNote(ticketId, note, adminUser)
changeTicketStatus(ticketId, status, adminUser)
```

#### Metrics
```typescript
getOverviewMetrics()
getFeatureUsage(params)
getFunnelCounts(params)
getRetentionStats(params)
getDashboardSummary()
```

## Multi-Tenancy

The dashboard supports company-first multi-tenancy:

1. **User scope**: Suspend individual users
2. **Company scope**: Suspend entire companies (all users blocked)

### Access Rules
```
Allow access if:
  company.status == "active"
  AND user.status == "active"
```

## RBAC (Role-Based Access Control)

### Admin Roles
- `founder`: Full access including dangerous operations
- `admin`: Full access except system settings
- `support`: View + ticket management
- `analyst`: View-only analytics access

### Permissions
```typescript
const ROLE_PERMISSIONS = {
  analyst: ["view:metrics", "view:analytics", "view:users", ...],
  support: [...analyst, "manage:tickets", "view:audit_logs"],
  admin: [...support, "manage:users", "manage:companies", ...],
  founder: [...admin, "delete:companies", "system:settings"],
};
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/metrics/overview` | GET | Dashboard metrics |
| `/api/admin/companies` | GET, POST | List/manage companies |
| `/api/admin/companies/[id]` | GET, PATCH | Company detail/actions |
| `/api/admin/users` | GET, POST | List/manage users |
| `/api/admin/users/[id]` | GET, PATCH | User detail/actions |
| `/api/admin/subscriptions` | GET, POST | List/manage subscriptions |
| `/api/admin/support` | GET | List tickets |
| `/api/admin/support/[id]` | GET, POST | Ticket detail/actions |

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables
3. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Contributing

1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Keep domain logic in `@trogern/domain`
4. Add audit logs for all admin actions

## License

Proprietary - Trogern Logistics
