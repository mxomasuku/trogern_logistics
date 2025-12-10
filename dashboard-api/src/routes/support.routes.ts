// src/routes/support.routes.ts
import { Router } from "express";
import {
    getTickets,
    getTicketById,
    createTicket,
    addMessage,
    nudgeTicket,
    registerAttachment,
    getTicketStats,
} from "../controllers/support.controller";

const router = Router();

// ============================================
// SUPPORT TICKET ROUTES
// ============================================

// GET /api/v1/support/tickets - List all tickets for company
// Query params: status, priority, type, limit
router.get("/tickets", getTickets);

// GET /api/v1/support/tickets/stats - Get ticket statistics
router.get("/tickets/stats", getTicketStats);

// GET /api/v1/support/tickets/:id - Get single ticket with messages
router.get("/tickets/:id", getTicketById);

// POST /api/v1/support/tickets - Create new ticket
router.post("/tickets", createTicket);

// POST /api/v1/support/tickets/:id/messages - Add message to ticket
router.post("/tickets/:id/messages", addMessage);

// POST /api/v1/support/tickets/:id/nudge - Nudge a ticket
router.post("/tickets/:id/nudge", nudgeTicket);

// POST /api/v1/support/attachments - Register uploaded attachment
router.post("/attachments", registerAttachment);

export default router;
