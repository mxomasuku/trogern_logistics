# Firebase Functions Deployment Checklist

## Current Status: ✅ DEPLOYABLE (with caveats)

Your functions folder **will deploy successfully**, but there are improvements to make for better maintainability and consistency with your monorepo.

---

## Pre-Deployment Checklist

### ✅ Required (Already Done)
- [x] TypeScript compiles successfully (`npm run build`)
- [x] Firebase config is valid (`firebase.json`)
- [x] All functions are exported in `index.ts`
- [x] No blocking errors in code

### ⚠️ Recommended (Should Fix)

#### 1. Fix Node Version Mismatch
**Current State:**
- `firebase.json`: `"runtime": "nodejs22"`
- `package.json`: `"node": "24"`

**Fix:** Update package.json to match firebase.json
```json
{
  "engines": {
    "node": "22"
  }
}
```

#### 2. Add .gcloudignore File
Create `.gcloudignore` to exclude unnecessary files from deployment:

```
# Files to exclude from deployment
node_modules/
.git/
.gitignore
*.log
firebase-debug*.log
firestore-debug.log
ui-debug.log
.DS_Store
*.local

# Emulator exports
firebase-export-*

# TypeScript source (we deploy compiled JS)
src/
tsconfig*.json
.eslintrc.js

# Development files
*.map
```

#### 3. Consider Adding @trogern/domain Dependency

**Current Approach:** Duplicated type definitions in functions folder  
**Better Approach:** Import from shared domain package

**Why?**
- Your `dashboard-api` already uses `@trogern/domain`
- Your functions have comments saying "mirrors @trogern/domain types"
- Type duplication creates maintenance burden
- Risk of types getting out of sync

**How to Add:**

1. Add to `functions/package.json` dependencies:
```json
"dependencies": {
  "@trogern/domain": "file:../packages/domain",
  "firebase-admin": "^13.6.0",
  "firebase-functions": "^7.0.1",
  "resend": "^6.6.0"
}
```

2. **IMPORTANT**: When deploying to Firebase, you MUST bundle the domain package because Firebase Functions can't access local file references. You have two options:

   **Option A: Pre-deploy Step (Recommended)**
   - Build domain package before deploying
   - Copy compiled domain package into functions folder
   - Modify package.json temporarily for deployment

   **Option B: Bundle Everything**
   - Use a bundler like `esbuild` or `webpack` to bundle all code
   - Deploy the bundle instead of raw source

---

## Deployment Commands

### Deploy to Production
```bash
# From the root of your repository
firebase deploy --only functions

# Or from functions folder
npm run deploy
```

### Deploy Specific Function
```bash
firebase deploy --only functions:onTicketCreated
```

### Deploy Multiple Functions
```bash
firebase deploy --only functions:onTicketCreated,functions:onMessageCreated
```

---

## Current Functions Exported

Your `functions/src/index.ts` exports the following Cloud Functions:

### Firestore Triggers
- `createOrUpdateVehicleServiceRecord` - Manages vehicle service tracking
- `onVehicleCreated` - Initializes tracker when vehicle is created
- `onIncomeLogCreated` - Updates vehicle income tracking
- `onIncomeCreated` - Income aggregation
- `onIncomeDeleted` - Income aggregation cleanup

### Scheduled Jobs (Cron)
- `cronServiceDueWeekly` - Weekly service due checks
- `cronMissingIncomeLogs` - Daily missing income log alerts
- `cronGenerateReportsDaily` - Daily report generation

### Notification System
- `onNotificationCreated` - Processes notifications (sends emails)
- `onTicketCreated` - Creates notification when ticket is created
- `onTicketUpdated` - Creates notification when ticket is updated
- `onMessageCreated` - Creates notification when message is sent

**Total:** 12 functions

---

## Environment Variables

### Required for Production
Make sure these are set in Firebase Functions config:

```bash
# Check current config
firebase functions:config:get

# Set email configuration (Resend)
firebase functions:config:set resend.api_key="YOUR_RESEND_API_KEY"

# Set any other required variables
firebase functions:config:set app.domain="trogern.com"
```

---

## Testing Before Deployment

### 1. Build and Lint
```bash
npm run lint
npm run build
```

### 2. Test with Emulators
```bash
npm run dev-emulators
```

### 3. Verify No Emulator References in Production Code
Make sure your code doesn't have hardcoded emulator URLs or dev-specific logic that would break in production.

---

## Post-Deployment Verification

### 1. Check Function Logs
```bash
firebase functions:log
```

### 2. Verify Functions Are Running
```bash
firebase functions:list
```

### 3. Test a Function
Trigger a function manually and check logs to ensure it executes correctly.

---

## Rollback Plan

If deployment causes issues:

```bash
# View deployment history
firebase functions:list

# Revert to previous version (if needed)
# Note: Firebase doesn't have automatic rollback, you'd need to redeploy the previous code
```

---

## Summary

✅ **Your functions folder IS deployable right now**  
⚠️ **Fix Node version mismatch before deploying**  
💡 **Consider adding @trogern/domain for better code reuse**  
📝 **Add .gcloudignore to optimize deployment**

**Estimated deployment time:** 2-5 minutes  
**Number of functions to deploy:** 12
