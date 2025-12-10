// HIGHLIGHT: central logger

import { Request } from "express";
const { db } = require("../config/firebase"); // HIGHLIGHT

// HIGHLIGHT: shape of a log entry
export interface LogContext {
  correlationId?: string;
  uid?: string | null;
  email?: string | null;
  companyId?: string | null;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  level?: "info" | "error";
  source?: "backend" | "frontend";
  tags?: string[];
  message?: string;
  // HIGHLIGHT: allow extra fields
  [key: string]: unknown;
}

// HIGHLIGHT: common helper to extract basic context from a request
export function getRequestContext(req: Request): Partial<LogContext> {
  const anyReq = req as any; // to read req.user / req.companyId / req.correlationId

  return {
    correlationId: anyReq.correlationId,
    uid: anyReq.user?.uid,
    companyId: anyReq.user?.companyId,
    path: req.path,
    method: req.method,
  };
}

// HIGHLIGHT: base writer – console + Firestore
async function writeLogToStore(entry: LogContext) {
  const payload = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // HIGHLIGHT: console for local debugging
  if (entry.level === "error") {
    // eslint-disable-next-line no-console
    console.error("[APP_LOG]", JSON.stringify(payload));
  } else {
    // eslint-disable-next-line no-console
    console.log("[APP_LOG]", JSON.stringify(payload));
  }

  try {
    // HIGHLIGHT: Firestore central collection
    await db.collection("appLogs").add(payload);
  } catch (firestoreError) {
    // eslint-disable-next-line no-console
    console.error("[APP_LOG_WRITE_FAILED]", firestoreError);
  }
}

// HIGHLIGHT: public helpers

export async function logInfo(message: string, ctx: LogContext = {}) {
  await writeLogToStore({
    level: "info",
    source: "backend",
    message,
    ...ctx,
  });
}

export async function logError(message: string, ctx: LogContext = {}) {
  await writeLogToStore({
    level: "error",
    source: "backend",
    message,
    ...ctx,
  });
}