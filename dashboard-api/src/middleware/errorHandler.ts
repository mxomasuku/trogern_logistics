// HIGHLIGHT: global error handler

import { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth.types";
import { logError, getRequestContext } from "../utils/logger";

export async function errorHandler(
  err: any,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // HIGHLIGHT: log full error details
  void logError("unhandled_error", {
    ...getRequestContext(req),
    correlationId: (req as any).correlationId,
    statusCode: res.statusCode || 500,
    errorName: err?.name,
    errorMessage: err?.message,
    errorStack: err?.stack,
    tags: ["backend", "unhandled"],
  });

  const status = err.statusCode || 500;

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    success: false,
    error: {
      message:
        status === 500
          ? "Internal server error"
          : err.message || "Request failed",
      correlationId: (req as any).correlationId, // HIGHLIGHT
    },
  });
}