import { initializeFirebaseAdmin, getDb, getAuthAdmin, Collections } from "@trogern/domain";

// Re-export for use in Next.js server components and route handlers
export { initializeFirebaseAdmin, getDb, getAuthAdmin, Collections };

// Initialize Firebase Admin on import (server-side only)
if (typeof window === "undefined") {
  initializeFirebaseAdmin();
}
