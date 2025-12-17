// functions/src/triggers/tickets/onTicketCreated.ts
// Trigger that fires when a support ticket is created

import { onDocumentCreated } from "firebase-functions/v2/firestore";
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
    createdBy?: TicketCreator;
    email: string;
    createdAt: Timestamp;
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
 * Map ticket priority to notification priority
 */
function mapPriority(ticketPriority: string): "low" | "normal" | "high" | "urgent" {
    switch (ticketPriority) {
        case "critical":
            return "urgent";
        case "high":
            return "high";
        case "medium":
            return "normal";
        default:
            return "low";
    }
}

/**
 * Trigger: onTicketCreated
 * 
 * Fires when a new support ticket is created.
 * Creates notifications for all admins about the new ticket.
 */
export const onTicketCreated = onDocumentCreated(
    "supportTickets/{ticketId}",  // FIXED: Changed from "tickets" to "supportTickets"
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }

        const ticket = snapshot.data() as SupportTicket;
        const ticketId = event.params.ticketId;

        console.log(`[onTicketCreated] New ticket created: ${ticketId}`, {
            subject: ticket.subject,
            type: ticket.type,
            priority: ticket.priority,
        });

        const db = getFirestore();
        const now = Timestamp.now();

        // Get all active admins
        const adminsSnapshot = await db
            .collection("adminUsers")
            .where("isActive", "==", true)
            .get();

        if (adminsSnapshot.empty) {
            console.log("[onTicketCreated] No active admins found to notify");
            return;
        }

        // Create notification for each admin
        const batch = db.batch();
        let notificationCount = 0;

        for (const adminDoc of adminsSnapshot.docs) {
            const admin = adminDoc.data();

            const notification: NotificationDoc = {
                recipientType: "admin",
                recipientId: adminDoc.id,
                recipientEmail: admin.email || "",
                recipientName: admin.name || "Admin",
                category: "support",
                type: "ticket_created",
                title: `New Support Ticket: ${ticket.subject}`,
                body: `${ticket.createdBy?.name || "A user"} submitted a ${ticket.type} ticket${ticket.companyId ? ` from company ${ticket.companyId}` : ""}.`,
                sourceType: "ticket",
                sourceId: ticketId,
                companyId: ticket.companyId,
                actionUrl: `/admin/support/${ticketId}`,  // FIXED: Updated to correct admin route
                actionLabel: "View Ticket",
                priority: mapPriority(ticket.priority),
                read: false,
                dismissed: false,
                emailSent: false,
                createdAt: now,
                idempotencyKey: `ticket_created_${ticketId}_${adminDoc.id}`,
            };

            const notifRef = db.collection("notifications").doc();
            batch.set(notifRef, notification);
            notificationCount++;
        }

        await batch.commit();

        console.log(`[onTicketCreated] Created ${notificationCount} admin notifications for ticket ${ticketId}`);
    }
);

