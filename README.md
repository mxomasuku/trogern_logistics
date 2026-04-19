# 🚚 Trogern Logistics Platform - Monorepo

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

Welcome to the **Trogern Logistics** administration and fleet management platform monorepo! This repository holds the entire suite of internal tools, APIs, and business logic that powers the Trogern logistics ecosystem.

## 👥 Who This Is For

This repository is primarily for **Engineers, QA, and DevOps** working on the high-level administrative, support, and fleet management side of Trogern Logistics. 

If you are looking to:
- Build features for the Admin portal used by founders and internal staff (`/admin-dashboard`)
- Enhance the primary client-facing Dashboard (`/dashboard-front`)
- Expand the core REST API backend (`/dashboard-api`)
- Update background tasks and Firebase Cloud Functions (`/functions`)
- Modify shared business domain models and type definitions (`/packages/domain`)

...then you are in the right place!

## 🧩 How to Wire & Architecture Overview

This project uses a modern monorepo architecture, neatly isolating frontends, backends, and shared business logic. Here is how the pieces wire together:

* **`/packages/domain`**: The heart of the application. This is a shared TS workspace containing cross-application domain logic, schemas, User/Company models, Subscription shapes, and RBAC permission rules. **All other apps depend on this.**
* **`/dashboard-api`**: A REST API backend built on **Node.js & Express**. It connects to Firebase Firestore and handles the core business logic, serving the frontends.
* **`/admin-dashboard`**: The Admin portal built with **Next.js 15 (App Router)** and React Server Components. Designed for founders/support to manage the ecosystem. It consumes the `dashboard-api` and Firebase directly.
* **`/dashboard-front`**: The primary client/user frontend app built using **React, Vite**, and Radix UI. It also consumes the `dashboard-api`.
* **`/functions`**: Serverless backend triggers (e.g., Firestore document writes, Auth events, stripe webhooks) handled via **Firebase Cloud Functions**.

**Data Flow Framework:** Clients (`admin-dashboard`, `dashboard-front`) -> REST API (`dashboard-api`) -> Database (Firebase Firestore). Cloud Functions trigger asynchronously on database events.

## 🛠️ How to Use (Local Development)

### Prerequisites
* Node.js 18 or higher
* npm / yarn
* Firebase CLI (`npm install -g firebase-tools`)

### 1. Initial Setup
Install dependencies at the root to cover all workspaces:
```bash
npm install
```

### 2. Environment Variables
You will need to set up environment variables for each application pointing to your development Firebase instance or API backend.

**Admin Dashboard:**
```bash
cp admin-dashboard/.env.example admin-dashboard/.env.local
```
**Dashboard API:**
```bash
cp dashboard-api/.env.example dashboard-api/.env.development
```
*(Contact your lead for the development Firebase configuration keys and API variables.)*

### 3. Running the Apps
You can start the respective environments individually based on what you are working on:

To run the **API Backend** (we highly recommend starting this first):
```bash
cd dashboard-api
npm run dev
```

To run the **Vite Dashboard Frontend**:
```bash
cd dashboard-front
npm run dev
```

To run the **Next.js Admin Dashboard**:
```bash
cd admin-dashboard
npm run dev
```

## 🤝 Rules for Contribution

We maintain a high standard for code quality and security. When exploring the code or submitting PRs, you **must** adhere to the following rules:

1. **Strict TypeScript & Centralized Domain Models:** We enforce strict TypeScript globally. If you change or add a data model (e.g., AppUser, Company, Subscription), **you must update the central types in `@trogern/domain`**. Do not create isolated/duplicate types in the frontend or backend!
2. **Access Control (RBAC):** Trogern Logistics uses granular Role-Based Access Control combined with a Company-First multi-tenancy model. When adding new API endpoints or pages:
   - Ensure you are validating user roles (e.g., `analyst`, `support`, `admin`, `founder`).
   - Ensure queries and data mutations are strictly scoped by the user's parent company (`companyId`) to prevent cross-tenant data leaks.
3. **Audit Logging:** Any destructive or state-changing action in the platform (e.g., suspending a user, deleting a company, changing a subscription plan) **must** generate a system audit log.
4. **UI & Accessibility:** New UI components in frontends should follow the Radix UI accessibility standards already in place and use the existing Tailwind CSS design tokens and brand colors.
5. **Database Security:** No direct production database writes from the client unless absolutely necessary. All significant mutations should go through the `dashboard-api` or be safely guarded by stringent `firestore.rules`.

## 📝 License

Proprietary - Trogern Logistics
