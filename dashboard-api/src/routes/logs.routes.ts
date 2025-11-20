// HIGHLIGHT: frontend log ingestion route

import { Router, Request, Response } from "express";
import { logError, logInfo } from "../utils/logger";

const router = Router();

router.post("/client-log", async (req: Request, res: Response) => {
  const { level, message, stack, componentStack, extra } = req.body || {};

  if (!message) {
    return res.status(400).json({ success: false, error: "Missing message" });
  }

  const logFn = level === "error" ? logError : logInfo;

  await logFn("frontend_log", {
    source: "frontend",
    level: level || "info",
    message,
    errorStack: stack,
    componentStack,
    extra: extra || {},
    tags: ["frontend"],
  });

  res.json({ success: true });
});

export default router;