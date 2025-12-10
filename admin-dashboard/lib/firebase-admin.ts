import { initializeFirebaseAdmin, getDb, getAuthAdmin, Collections } from "@trogern/domain";

// Initialize Firebase Admin on import (server-side only)
if (typeof window === "undefined") {
  initializeFirebaseAdmin();
}

// Re-export for use in Next.js server components and route handlers
export { initializeFirebaseAdmin, getDb, getAuthAdmin, Collections };

// Convenient named exports for common usage
export const adminDb = getDb();
export const adminAuth = getAuthAdmin();

