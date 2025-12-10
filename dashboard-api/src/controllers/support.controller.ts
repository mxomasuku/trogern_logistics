// src/controllers/support.controller.ts
import { Request, Response } from "express";
const { db, admin } = require("../config/firebase");
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { success, failure } from "../utils/apiResponse";
import { logInfo, logError } from "../utils/logger";
import { requireCompanyContext, CompanyContext } from "../utils/companyContext";

// Domain types
import type {
    TicketType,
    TicketPriority,
    TicketStatus,
    TicketAttachment,
    TicketCreator,
    SupportTicket,
    TicketMessage,
    TicketListItem,
} from "@trogern/domain";

// Collections
const TICKETS_COLLECTION = "supportTickets";
const MESSAGES_SUBCOLLECTION = "messages";
const ATTACHMENTS_COLLECTION = "ticketAttachments";

const ticketsRef = db.collection(TICKETS_COLLECTION);
const nowTs = () => admin.firestore.Timestamp.now();

// Stale threshold (no activity for 3 days)
const STALE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

// Nudge cooldown (24 hours)
const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// ===============================================
// HELPER: Generate ticket ID (TKT-XXXX)
// ===============================================
async function generateTicketId(): Promise<string> {
    const counterRef = db.collection("counters").doc("ticketCounter");

    const result = await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
        const counterDoc = await tx.get(counterRef) as unknown as FirebaseFirestore.DocumentSnapshot;
        let currentCount = 1;

        if (counterDoc.exists) {
            const counterData = counterDoc.data() as { count?: number } | undefined;
            currentCount = (counterData?.count ?? 0) + 1;
        }

        tx.set(counterRef, { count: currentCount, updatedAt: nowTs() });
        return currentCount;
    });

    return `TKT-${String(result).padStart(4, "0")}`;
}

// ===============================================
// HELPER: Check if ticket is stale
// ===============================================
function isTicketStale(lastActivityAt: FirebaseFirestore.Timestamp | null): boolean {
    if (!lastActivityAt) return false;
    const lastActivity = lastActivityAt.toDate().getTime();
    return Date.now() - lastActivity > STALE_THRESHOLD_MS;
}

// ===============================================
// HELPER: Can user nudge ticket
// ===============================================
function canNudge(ticket: SupportTicket): boolean {
    // Can only nudge open or in_progress tickets
    if (!["open", "in_progress"].includes(ticket.status)) return false;

    if (ticket.lastNudgedAt) {
        const lastNudge = (ticket.lastNudgedAt as FirebaseFirestore.Timestamp).toDate().getTime();
        return Date.now() - lastNudge > NUDGE_COOLDOWN_MS;
    }

    return true;
}

// ===============================================
// GET ALL TICKETS (scoped to company)
// ===============================================
export const getTickets = async (req: Request, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId, uid, email } = ctx;

    try {
        // Query params for filtering
        const { status, priority, type, limit = 50 } = req.query;

        let query = ticketsRef
            .where("companyId", "==", companyId)
            .orderBy("createdAt", "desc")
            .limit(Number(limit));

        // Apply filters if provided
        if (status && typeof status === "string") {
            query = query.where("status", "==", status);
        }
        if (priority && typeof priority === "string") {
            query = query.where("priority", "==", priority);
        }
        if (type && typeof type === "string") {
            query = query.where("type", "==", type);
        }

        const snapshot = await query.get();

        const tickets: TicketListItem[] = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const data = doc.data();
            const lastActivityAt = data.lastActivityAt || data.updatedAt;

            return {
                id: doc.id,
                subject: data.subject,
                type: data.type,
                priority: data.priority,
                status: data.status,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                lastActivityAt: lastActivityAt?.toDate?.()?.toISOString() || lastActivityAt,
                messageCount: data.messageCount ?? 0,
                hasAttachments: (data.attachments?.length ?? 0) > 0,
                createdBy: data.createdBy ? {
                    name: data.createdBy.name,
                    avatarUrl: data.createdBy.avatarUrl,
                } : undefined,
                assignedToName: data.assignedToName,
                isStale: isTicketStale(lastActivityAt),
            };
        });

        void logInfo("tickets_listed", {
            uid,
            email,
            companyId,
            path: req.path,
            method: "GET",
            tags: ["support", "list"],
            message: `${email} listed ${tickets.length} tickets`,
            count: tickets.length,
        });

        return res.status(200).json(success(tickets));
    } catch (error: any) {
        console.error("Error fetching tickets:", error);
        void logError("tickets_list_failed", {
            uid,
            email,
            companyId,
            error: error.message,
            tags: ["support", "error"],
        });
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to fetch tickets", error.message)
        );
    }
};

// ===============================================
// GET SINGLE TICKET BY ID
// ===============================================
export const getTicketById = async (req: Request, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId, uid, email } = ctx;
    const { id } = req.params;

    try {
        const ticketDoc = await ticketsRef.doc(id).get();

        if (!ticketDoc.exists) {
            return res.status(404).json(
                failure("NOT_FOUND", "Ticket not found", { id })
            );
        }

        const ticketData = ticketDoc.data();

        // Ensure ticket belongs to user's company
        if (ticketData.companyId !== companyId) {
            return res.status(404).json(
                failure("NOT_FOUND", "Ticket not found in this company", { id })
            );
        }

        // Get messages subcollection
        const messagesSnapshot = await ticketsRef
            .doc(id)
            .collection(MESSAGES_SUBCOLLECTION)
            .orderBy("createdAt", "asc")
            .get();

        const messages: TicketMessage[] = messagesSnapshot.docs.map((msgDoc: QueryDocumentSnapshot) => {
            const msgData = msgDoc.data();
            return {
                id: msgDoc.id,
                ticketId: id,
                senderType: msgData.senderType === "admin" ? "admin" : "user",
                senderId: msgData.senderId || msgData.authorId,
                senderName: msgData.senderName || msgData.authorName || "Unknown",
                body: msgData.body || msgData.content,
                attachments: msgData.attachments || [],
                createdAt: msgData.createdAt?.toDate?.()?.toISOString() || msgData.createdAt,
                isInternalNote: msgData.isInternalNote ?? false,
            } as TicketMessage;
        });

        // Convert ticket to response format
        const ticket: SupportTicket = {
            id: ticketDoc.id,
            subject: ticketData.subject,
            message: ticketData.message,
            attachments: ticketData.attachments || [],
            type: ticketData.type,
            priority: ticketData.priority,
            status: ticketData.status,
            companyId: ticketData.companyId,
            userId: ticketData.userId,
            email: ticketData.email,
            createdBy: ticketData.createdBy,
            assignedTo: ticketData.assignedTo,
            assignedToName: ticketData.assignedToName,
            createdAt: ticketData.createdAt?.toDate?.()?.toISOString() || ticketData.createdAt,
            updatedAt: ticketData.updatedAt?.toDate?.()?.toISOString() || ticketData.updatedAt,
            lastActivityAt: ticketData.lastActivityAt?.toDate?.()?.toISOString() || ticketData.lastActivityAt,
            resolvedAt: ticketData.resolvedAt?.toDate?.()?.toISOString() || ticketData.resolvedAt,
            lastUpdatedBy: ticketData.lastUpdatedBy,
            messageCount: ticketData.messageCount ?? 0,
            duplicateOf: ticketData.duplicateOf,
            lastNudgedAt: ticketData.lastNudgedAt?.toDate?.()?.toISOString() || ticketData.lastNudgedAt,
            nudgeCount: ticketData.nudgeCount ?? 0,
        };

        void logInfo("ticket_viewed", {
            uid,
            email,
            companyId,
            ticketId: id,
            tags: ["support", "view"],
            message: `${email} viewed ticket ${id}`,
        });

        return res.status(200).json(success({ ticket, messages }));
    } catch (error: any) {
        console.error("Error fetching ticket:", error);
        void logError("ticket_view_failed", {
            uid,
            email,
            companyId,
            ticketId: id,
            error: error.message,
            tags: ["support", "error"],
        });
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to fetch ticket", error.message)
        );
    }
};

// ===============================================
// CREATE TICKET
// ===============================================
interface CreateTicketBody {
    type: TicketType;
    priority: TicketPriority;
    subject: string;
    message: string;
    attachmentIds?: string[];
}

export const createTicket = async (
    req: Request<{}, {}, CreateTicketBody>,
    res: Response
) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId, uid, email } = ctx;

    const { type, priority, subject, message, attachmentIds } = req.body;

    // Validation
    const missingFields: string[] = [];
    if (!type) missingFields.push("type");
    if (!priority) missingFields.push("priority");
    if (!subject) missingFields.push("subject");
    if (!message) missingFields.push("message");

    if (missingFields.length > 0) {
        return res.status(400).json(
            failure("VALIDATION_ERROR", "Missing required fields", { missingFields })
        );
    }

    // Validate type
    const validTypes: TicketType[] = ["bug", "feature", "question", "other"];
    if (!validTypes.includes(type)) {
        return res.status(400).json(
            failure("VALIDATION_ERROR", "Invalid ticket type", { type })
        );
    }

    // Validate priority
    const validPriorities: TicketPriority[] = ["low", "medium", "high", "critical"];
    if (!validPriorities.includes(priority)) {
        return res.status(400).json(
            failure("VALIDATION_ERROR", "Invalid priority", { priority })
        );
    }

    try {
        // Get user info for creator
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const userName = userData.name || userData.displayName || email?.split("@")[0] || "User";

        // Generate ticket ID
        const ticketId = await generateTicketId();

        // Process attachments if provided
        let attachments: TicketAttachment[] = [];
        if (attachmentIds && attachmentIds.length > 0) {
            const attachmentDocs = await Promise.all(
                attachmentIds.map(id => db.collection(ATTACHMENTS_COLLECTION).doc(id).get())
            );
            attachments = attachmentDocs
                .filter(doc => doc.exists && doc.data().uploadedBy === uid)
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as TicketAttachment[];
        }

        // Create ticket data
        const createdBy: TicketCreator = {
            id: uid,
            name: userName,
            email: email || "",
            avatarUrl: userData.picture || userData.avatarUrl || null,
        };

        const now = nowTs();
        const ticketData = {
            subject,
            message,
            attachments,
            type,
            priority,
            status: "open" as TicketStatus,
            companyId,
            userId: uid,
            email: email || "",
            createdBy,
            createdAt: now,
            updatedAt: now,
            lastActivityAt: now,
            lastUpdatedBy: "user",
            messageCount: 0,
            nudgeCount: 0,
        };

        // Save ticket
        await ticketsRef.doc(ticketId).set(ticketData);

        void logInfo("ticket_created", {
            uid,
            email,
            companyId,
            ticketId,
            ticketType: type,
            priority,
            tags: ["support", "create"],
            message: `${email} created ticket ${ticketId}: ${subject}`,
        });

        return res.status(201).json(success({
            id: ticketId,
            ...ticketData,
            createdAt: now.toDate().toISOString(),
            updatedAt: now.toDate().toISOString(),
            lastActivityAt: now.toDate().toISOString(),
        }));
    } catch (error: any) {
        console.error("Error creating ticket:", error);
        void logError("ticket_create_failed", {
            uid,
            email,
            companyId,
            error: error.message,
            tags: ["support", "error"],
        });
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to create ticket", error.message)
        );
    }
};

// ===============================================
// ADD MESSAGE TO TICKET
// ===============================================
interface AddMessageBody {
    content: string;
    attachmentIds?: string[];
}

export const addMessage = async (
    req: Request<{ id: string }, {}, AddMessageBody>,
    res: Response
) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId, uid, email } = ctx;
    const { id: ticketId } = req.params;
    const { content, attachmentIds } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json(
            failure("VALIDATION_ERROR", "Message content is required")
        );
    }

    try {
        // Verify ticket exists and belongs to company
        const ticketDoc = await ticketsRef.doc(ticketId).get();

        if (!ticketDoc.exists) {
            return res.status(404).json(
                failure("NOT_FOUND", "Ticket not found", { ticketId })
            );
        }

        const ticketData = ticketDoc.data();
        if (ticketData.companyId !== companyId) {
            return res.status(404).json(
                failure("NOT_FOUND", "Ticket not found in this company", { ticketId })
            );
        }

        // Check if ticket is open for messages
        const closedStatuses: TicketStatus[] = ["closed", "resolved", "duplicate"];
        if (closedStatuses.includes(ticketData.status)) {
            return res.status(400).json(
                failure("TICKET_CLOSED", "Cannot add messages to closed tickets", { status: ticketData.status })
            );
        }

        // Get user info
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const userName = userData.name || userData.displayName || email?.split("@")[0] || "User";

        // Process attachments
        let attachments: TicketAttachment[] = [];
        if (attachmentIds && attachmentIds.length > 0) {
            const attachmentDocs = await Promise.all(
                attachmentIds.map(id => db.collection(ATTACHMENTS_COLLECTION).doc(id).get())
            );
            attachments = attachmentDocs
                .filter(doc => doc.exists && doc.data().uploadedBy === uid)
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as TicketAttachment[];
        }

        const now = nowTs();
        const messageData = {
            body: content.trim(),
            content: content.trim(),
            senderType: "user",
            senderId: uid,
            senderName: userName,
            authorId: uid,
            authorName: userName,
            authorType: "client",
            attachments,
            createdAt: now,
            isInternalNote: false,
        };

        // Add message
        const messageRef = await ticketsRef
            .doc(ticketId)
            .collection(MESSAGES_SUBCOLLECTION)
            .add(messageData);

        // Update ticket
        await ticketsRef.doc(ticketId).update({
            messageCount: admin.firestore.FieldValue.increment(1),
            lastActivityAt: now,
            updatedAt: now,
            lastUpdatedBy: "user",
            // If awaiting response, move back to in_progress
            ...(ticketData.status === "awaiting_response" ? { status: "in_progress" } : {}),
        });

        void logInfo("message_added", {
            uid,
            email,
            companyId,
            ticketId,
            messageId: messageRef.id,
            tags: ["support", "message"],
            message: `${email} added message to ticket ${ticketId}`,
        });

        return res.status(201).json(success({
            id: messageRef.id,
            ticketId,
            ...messageData,
            createdAt: now.toDate().toISOString(),
        }));
    } catch (error: any) {
        console.error("Error adding message:", error);
        void logError("message_add_failed", {
            uid,
            email,
            companyId,
            ticketId,
            error: error.message,
            tags: ["support", "error"],
        });
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to add message", error.message)
        );
    }
};

// ===============================================
// NUDGE TICKET
// ===============================================
interface NudgeBody {
    message?: string;
}

export const nudgeTicket = async (
    req: Request<{ id: string }, {}, NudgeBody>,
    res: Response
) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId, uid, email } = ctx;
    const { id: ticketId } = req.params;
    const { message: nudgeMessage } = req.body;

    try {
        const ticketDoc = await ticketsRef.doc(ticketId).get();

        if (!ticketDoc.exists) {
            return res.status(404).json(
                failure("NOT_FOUND", "Ticket not found", { ticketId })
            );
        }

        const ticketData = ticketDoc.data() as SupportTicket;

        if (ticketData.companyId !== companyId) {
            return res.status(404).json(
                failure("NOT_FOUND", "Ticket not found in this company", { ticketId })
            );
        }

        // Check if nudge is allowed
        if (!canNudge(ticketData)) {
            const reason = !["open", "in_progress"].includes(ticketData.status)
                ? "Ticket is not in a nudgeable status"
                : "You can only nudge once every 24 hours";
            return res.status(400).json(
                failure("NUDGE_NOT_ALLOWED", reason, { status: ticketData.status })
            );
        }

        const now = nowTs();

        // Update ticket with nudge info
        await ticketsRef.doc(ticketId).update({
            lastNudgedAt: now,
            nudgeCount: admin.firestore.FieldValue.increment(1),
            lastActivityAt: now,
            updatedAt: now,
        });

        // Optionally add a system message about the nudge
        if (nudgeMessage) {
            const userDoc = await db.collection("users").doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            const userName = userData.name || email?.split("@")[0] || "User";

            await ticketsRef
                .doc(ticketId)
                .collection(MESSAGES_SUBCOLLECTION)
                .add({
                    body: `[Nudge] ${nudgeMessage}`,
                    content: `[Nudge] ${nudgeMessage}`,
                    senderType: "user",
                    senderId: uid,
                    senderName: userName,
                    authorType: "client",
                    createdAt: now,
                    isInternalNote: false,
                });

            await ticketsRef.doc(ticketId).update({
                messageCount: admin.firestore.FieldValue.increment(1),
            });
        }

        void logInfo("ticket_nudged", {
            uid,
            email,
            companyId,
            ticketId,
            nudgeCount: (ticketData.nudgeCount ?? 0) + 1,
            tags: ["support", "nudge"],
            message: `${email} nudged ticket ${ticketId}`,
        });

        return res.status(200).json(success({
            ticketId,
            nudged: true,
            nextNudgeAvailable: new Date(Date.now() + NUDGE_COOLDOWN_MS).toISOString(),
        }));
    } catch (error: any) {
        console.error("Error nudging ticket:", error);
        void logError("ticket_nudge_failed", {
            uid,
            email,
            companyId,
            ticketId,
            error: error.message,
            tags: ["support", "error"],
        });
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to nudge ticket", error.message)
        );
    }
};

// ===============================================
// UPLOAD ATTACHMENT (pre-upload metadata)
// ===============================================
interface UploadAttachmentBody {
    filename: string;
    mimeType: string;
    size: number;
    url: string; // Storage URL after client uploads to Firebase Storage
}

export const registerAttachment = async (
    req: Request<{}, {}, UploadAttachmentBody>,
    res: Response
) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { uid, email, companyId } = ctx;

    const { filename, mimeType, size, url } = req.body;

    // Validation
    if (!filename || !mimeType || !size || !url) {
        return res.status(400).json(
            failure("VALIDATION_ERROR", "Missing required attachment fields")
        );
    }

    // Validate file type
    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "application/pdf",
    ];
    if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json(
            failure("INVALID_FILE_TYPE", "File type not allowed", { mimeType, allowedTypes })
        );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (size > maxSize) {
        return res.status(400).json(
            failure("FILE_TOO_LARGE", "File exceeds maximum size of 5MB", { size, maxSize })
        );
    }

    try {
        const now = nowTs();
        const attachmentData: TicketAttachment = {
            id: "", // Will be set after creation
            url,
            filename,
            mimeType,
            size,
            uploadedAt: now as any,
            uploadedBy: uid,
        };

        const docRef = await db.collection(ATTACHMENTS_COLLECTION).add({
            ...attachmentData,
            companyId,
            createdAt: now,
        });

        void logInfo("attachment_registered", {
            uid,
            email,
            companyId,
            attachmentId: docRef.id,
            filename,
            tags: ["support", "attachment"],
            message: `${email} registered attachment ${filename}`,
        });

        return res.status(201).json(success({
            ...attachmentData,
            id: docRef.id,
            uploadedAt: now.toDate().toISOString(),
        }));
    } catch (error: any) {
        console.error("Error registering attachment:", error);
        void logError("attachment_register_failed", {
            uid,
            email,
            companyId,
            error: error.message,
            tags: ["support", "error"],
        });
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to register attachment", error.message)
        );
    }
};

// ===============================================
// GET TICKET STATS (for dashboard/summary view)
// ===============================================
export const getTicketStats = async (req: Request, res: Response) => {
    const ctx = await requireCompanyContext(req, res);
    if (!ctx) return;
    const { companyId, uid, email } = ctx;

    try {
        const snapshot = await ticketsRef
            .where("companyId", "==", companyId)
            .get();

        let stats = {
            total: 0,
            open: 0,
            inProgress: 0,
            awaitingResponse: 0,
            resolved: 0,
            closed: 0,
            stale: 0,
            highPriority: 0,
            criticalPriority: 0,
        };

        snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
            const data = doc.data();
            stats.total++;

            switch (data.status) {
                case "open": stats.open++; break;
                case "in_progress": stats.inProgress++; break;
                case "awaiting_response": stats.awaitingResponse++; break;
                case "resolved": stats.resolved++; break;
                case "closed": stats.closed++; break;
            }

            if (data.priority === "high") stats.highPriority++;
            if (data.priority === "critical") stats.criticalPriority++;

            const lastActivityAt = data.lastActivityAt || data.updatedAt;
            if (isTicketStale(lastActivityAt) && !["closed", "resolved", "duplicate"].includes(data.status)) {
                stats.stale++;
            }
        });

        void logInfo("ticket_stats_fetched", {
            uid,
            email,
            companyId,
            tags: ["support", "stats"],
            message: `${email} fetched ticket stats`,
        });

        return res.status(200).json(success(stats));
    } catch (error: any) {
        console.error("Error fetching ticket stats:", error);
        void logError("ticket_stats_failed", {
            uid,
            email,
            companyId,
            error: error.message,
            tags: ["support", "error"],
        });
        return res.status(500).json(
            failure("SERVER_ERROR", "Failed to fetch ticket stats", error.message)
        );
    }
};
