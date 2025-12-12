// functions/src/triggers/tickets/onTicketUpdated.ts
// Trigger that fires when a support ticket is updated

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Define types locally
interface TicketCreator {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
}

interface SupportTicket {
    id: string;
    subject: string;
    message: string;
    type: "bug" | "feature" | "question" | "other";
    priority: "low" | "medium" | "high" | "critical";
    status: string;
    companyId?: string;
    userId?: string;
    email: string;
    createdBy?: TicketCreator;
    assignedTo?: string;
    assignedToName?: string;
    lastNudgedAt?: Timestamp;
    nudgeCount?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface NotificationDoc {
    recipientType: "user" | "company" | "admin" | "all_admins";
    recipientId: string | null;
    recipientEmail: string;
    recipientName: string;
    category: string;
    type: string;
    title: string;
    body: string;
    sourceType: string;
    sourceId: string | null;
    companyId?: string;
    actionUrl?: string;
    actionLabel?: string;
    priority: "low" | "normal" | "high" | "urgent";
    read: boolean;
    dismissed: boolean;
    emailSent: boolean;
    createdAt: Timestamp;
    idempotencyKey?: string;
}

/**
 * Create a notification document
 */
async function createNotification(db: FirebaseFirestore.Firestore, notification: NotificationDoc): Promise<string> {
    // Check for duplicate if idempotencyKey provided
    if (notification.idempotencyKey) {
        const existing = await db
            .collection("notifications")
            .where("idempotencyKey", "==", notification.idempotencyKey)
            .limit(1)
            .get();

        if (!existing.empty) {
            console.log(`Duplicate notification skipped: ${notification.idempotencyKey}`);
            return "";
        }
    }

    const notifRef = await db.collection("notifications").add(notification);
    return notifRef.id;
}

/**
 * Trigger: onTicketUpdated
 * 
 * Fires when a support ticket is updated.
 * Handles:
 * - Status changes → notify client
 * - Nudges → notify admin
 * - Assignment changes → notify assigned admin
 */
export const onTicketUpdated = onDocumentUpdated(
    "tickets/{ticketId}",
    async (event) => {
        const beforeSnapshot = event.data?.before;
        const afterSnapshot = event.data?.after;

        if (!beforeSnapshot || !afterSnapshot) {
            console.log("No data associated with the event");
            return;
        }

        const before = beforeSnapshot.data() as SupportTicket;
        const after = afterSnapshot.data() as SupportTicket;
        const ticketId = event.params.ticketId;

        const db = getFirestore();
        const now = Timestamp.now();

        // ===== STATUS CHANGED - Notify client =====
        if (before.status !== after.status) {
            console.log(`[onTicketUpdated] Status changed: ${before.status} → ${after.status}`);

            // Get the client's email/info
            const clientEmail = after.createdBy?.email || after.email;
            const clientName = after.createdBy?.name || "User";
            const clientId = after.createdBy?.id || after.userId;

            if (clientEmail) {
                const statusNotification: NotificationDoc = {
                    recipientType: "user",
                    recipientId: clientId || null,
                    recipientEmail: clientEmail,
                    recipientName: clientName,
                    category: "support",
                    type: "ticket_status_changed",
                    title: `Ticket Status Updated: ${after.subject}`,
                    body: `Your support ticket status has been changed from "${before.status}" to "${after.status}".`,
                    sourceType: "ticket",
                    sourceId: ticketId,
                    companyId: after.companyId,
                    actionUrl: `/support/tickets/${ticketId}`,
                    actionLabel: "View Ticket",
                    priority: "normal",
                    read: false,
                    dismissed: false,
                    emailSent: false,
                    createdAt: now,
                };

                await createNotification(db, statusNotification);
                console.log(`[onTicketUpdated] Created status change notification for client ${clientEmail}`);
            }

            // If resolved, create a resolved notification
            if (after.status === "resolved") {
                const resolvedNotification: NotificationDoc = {
                    recipientType: "user",
                    recipientId: clientId || null,
                    recipientEmail: clientEmail || "",
                    recipientName: clientName,
                    category: "support",
                    type: "ticket_resolved",
                    title: `Ticket Resolved: ${after.subject}`,
                    body: "Your support ticket has been marked as resolved. Please let us know if you need further assistance.",
                    sourceType: "ticket",
                    sourceId: ticketId,
                    companyId: after.companyId,
                    actionUrl: `/support/tickets/${ticketId}`,
                    actionLabel: "View Ticket",
                    priority: "normal",
                    read: false,
                    dismissed: false,
                    emailSent: false,
                    createdAt: now,
                };

                await createNotification(db, resolvedNotification);
            }
        }

        // ===== NUDGED - Notify admin =====
        if (after.lastNudgedAt && (!before.lastNudgedAt || after.lastNudgedAt.toMillis() > before.lastNudgedAt.toMillis())) {
            console.log(`[onTicketUpdated] Ticket nudged (count: ${after.nudgeCount})`);

            // Notify assigned admin or all admins
            if (after.assignedTo) {
                // Get assigned admin's info
                const adminDoc = await db.collection("adminUsers").doc(after.assignedTo).get();
                const admin = adminDoc.data();

                if (admin) {
                    const nudgeNotification: NotificationDoc = {
                        recipientType: "admin",
                        recipientId: after.assignedTo,
                        recipientEmail: admin.email || "",
                        recipientName: admin.name || "Admin",
                        category: "support",
                        type: "ticket_nudged",
                        title: `Ticket Nudged: ${after.subject}`,
                        body: `${after.createdBy?.name || "A user"} is waiting for a response (nudged ${after.nudgeCount || 1} time${(after.nudgeCount || 1) > 1 ? "s" : ""}).`,
                        sourceType: "ticket",
                        sourceId: ticketId,
                        companyId: after.companyId,
                        actionUrl: `/support/tickets/${ticketId}`,
                        actionLabel: "Respond Now",
                        priority: "high",
                        read: false,
                        dismissed: false,
                        emailSent: false,
                        createdAt: now,
                    };

                    await createNotification(db, nudgeNotification);
                    console.log(`[onTicketUpdated] Created nudge notification for admin ${after.assignedTo}`);
                }
            } else {
                // Notify all admins
                const adminsSnapshot = await db.collection("adminUsers").where("isActive", "==", true).get();

                for (const adminDoc of adminsSnapshot.docs) {
                    const admin = adminDoc.data();

                    const nudgeNotification: NotificationDoc = {
                        recipientType: "admin",
                        recipientId: adminDoc.id,
                        recipientEmail: admin.email || "",
                        recipientName: admin.name || "Admin",
                        category: "support",
                        type: "ticket_nudged",
                        title: `Ticket Nudged: ${after.subject}`,
                        body: `${after.createdBy?.name || "A user"} is waiting for a response (nudged ${after.nudgeCount || 1} time${(after.nudgeCount || 1) > 1 ? "s" : ""}).`,
                        sourceType: "ticket",
                        sourceId: ticketId,
                        companyId: after.companyId,
                        actionUrl: `/support/tickets/${ticketId}`,
                        actionLabel: "Respond Now",
                        priority: "high",
                        read: false,
                        dismissed: false,
                        emailSent: false,
                        createdAt: now,
                    };

                    await createNotification(db, nudgeNotification);
                }

                console.log(`[onTicketUpdated] Created nudge notifications for all admins`);
            }
        }

        // ===== ASSIGNMENT CHANGED - Notify assigned admin =====
        if (after.assignedTo && after.assignedTo !== before.assignedTo) {
            console.log(`[onTicketUpdated] Assignment changed: ${before.assignedTo} → ${after.assignedTo}`);

            const adminDoc = await db.collection("adminUsers").doc(after.assignedTo).get();
            const admin = adminDoc.data();

            if (admin) {
                const assignmentNotification: NotificationDoc = {
                    recipientType: "admin",
                    recipientId: after.assignedTo,
                    recipientEmail: admin.email || "",
                    recipientName: admin.name || "Admin",
                    category: "support",
                    type: "ticket_assigned",
                    title: `Ticket Assigned to You: ${after.subject}`,
                    body: `You have been assigned a ${after.type} ticket from ${after.createdBy?.name || "a user"}.`,
                    sourceType: "ticket",
                    sourceId: ticketId,
                    companyId: after.companyId,
                    actionUrl: `/support/tickets/${ticketId}`,
                    actionLabel: "View Ticket",
                    priority: "normal",
                    read: false,
                    dismissed: false,
                    emailSent: false,
                    createdAt: now,
                };

                await createNotification(db, assignmentNotification);
                console.log(`[onTicketUpdated] Created assignment notification for admin ${after.assignedTo}`);
            }
        }
    }
);
