// HIGHLIGHT: request metrics middleware

import { NextFunction, Response } from "express";
import crypto from "crypto";
import type { AuthenticatedRequest } from "../types/auth.types";
import { logInfo, getRequestContext } from "../utils/logger";

export async function requestMetrics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const correlationId = crypto.randomUUID();
  (req as any).correlationId = correlationId;

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    const statusCode = res.statusCode;
    const success = statusCode < 500;

    // HIGHLIGHT: log ALL requests (no fragile path filter)
    void logInfo("http_request", {
      ...getRequestContext(req),
      correlationId,
      statusCode,
      durationMs,
      tags: ["http", "metrics"],
      success,
    });
  });

  next();
}