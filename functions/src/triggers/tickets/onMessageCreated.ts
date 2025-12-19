// functions/src/triggers/tickets/onMessageCreated.ts
// Trigger that fires when a message is added to a ticket

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {getFirestore, Timestamp, FieldValue} from "firebase-admin/firestore";

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
    companyId?: string;
    userId?: string;
    email: string;
    createdBy?: TicketCreator;
    assignedTo?: string;
    assignedToName?: string;
    messageCount?: number;
}

interface TicketMessage {
    id: string;
    ticketId: string;
    senderType: "user" | "admin";
    senderId?: string;
    senderName?: string;
    body: string;
    createdAt: Timestamp;
    isInternalNote: boolean;
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
}

/**
 * Truncate message for notification body
 */
function truncateMessage(message: string, maxLength = 100): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + "...";
}

/**
 * Trigger: onMessageCreated
 *
 * Fires when a new message is added to a ticket's messages subcollection.
 * Handles:
 * - Client message → notify admin
 * - Admin message → notify client
 * - Updates ticket lastActivityAt and messageCount
 */
export const onMessageCreated = onDocumentCreated(
  "supportTickets/{ticketId}/messages/{messageId}", // FIXED: Changed from "tickets" to "supportTickets"
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const message = snapshot.data() as TicketMessage;
    const ticketId = event.params.ticketId;
    const messageId = event.params.messageId;

    // Skip internal notes - they shouldn't notify clients
    if (message.isInternalNote) {
      console.log(`[onMessageCreated] Skipping internal note ${messageId}`);
      return;
    }

    console.log(`[onMessageCreated] New message on ticket ${ticketId}`, {
      senderType: message.senderType,
      senderId: message.senderId,
    });

    const db = getFirestore();
    const now = Timestamp.now();

    // Fetch parent ticket
    const ticketDoc = await db.collection("supportTickets").doc(ticketId).get(); // FIXED: Changed from "tickets" to "supportTickets"
    if (!ticketDoc.exists) {
      console.error(`[onMessageCreated] Ticket ${ticketId} not found`);
      return;
    }

    const ticket = ticketDoc.data() as SupportTicket;

    // Update ticket with new activity
    await ticketDoc.ref.update({
      messageCount: FieldValue.increment(1),
      lastActivityAt: now,
      updatedAt: now,
      lastUpdatedBy: message.senderType,
    });

    // Create notification based on sender type
    if (message.senderType === "user") {
      // Client sent message - notify admin(s)
      console.log("[onMessageCreated] Client message - notifying admin(s)");

      if (ticket.assignedTo) {
        // Notify assigned admin
        const adminDoc = await db.collection("adminUsers").doc(ticket.assignedTo).get();
        const admin = adminDoc.data();

        if (admin) {
          const notification: NotificationDoc = {
            recipientType: "admin",
            recipientId: ticket.assignedTo,
            recipientEmail: admin.email || "",
            recipientName: admin.name || "Admin",
            category: "support",
            type: "ticket_message",
            title: `New Message: ${ticket.subject}`,
            body: `${message.senderName || "User"}: "${truncateMessage(message.body)}"`,
            sourceType: "ticket",
            sourceId: ticketId,
            companyId: ticket.companyId,
            actionUrl: `/admin/support/${ticketId}`, // FIXED: Updated to correct admin route
            actionLabel: "Reply",
            priority: "normal",
            read: false,
            dismissed: false,
            emailSent: false,
            createdAt: now,
          };

          await db.collection("notifications").add(notification);
          console.log(`[onMessageCreated] Created notification for assigned admin ${ticket.assignedTo}`);
        }
      } else {
        // Notify all active admins
        const adminsSnapshot = await db.collection("adminUsers").where("isActive", "==", true).get();

        const batch = db.batch();
        for (const adminDoc of adminsSnapshot.docs) {
          const admin = adminDoc.data();

          const notification: NotificationDoc = {
            recipientType: "admin",
            recipientId: adminDoc.id,
            recipientEmail: admin.email || "",
            recipientName: admin.name || "Admin",
            category: "support",
            type: "ticket_message",
            title: `New Message: ${ticket.subject}`,
            body: `${message.senderName || "User"}: "${truncateMessage(message.body)}"`,
            sourceType: "ticket",
            sourceId: ticketId,
            companyId: ticket.companyId,
            actionUrl: `/admin/support/${ticketId}`, // FIXED: Updated to correct admin route
            actionLabel: "Reply",
            priority: "normal",
            read: false,
            dismissed: false,
            emailSent: false,
            createdAt: now,
          };

          const notifRef = db.collection("notifications").doc();
          batch.set(notifRef, notification);
        }

        await batch.commit();
        console.log(`[onMessageCreated] Created notifications for ${adminsSnapshot.size} admins`);
      }
    } else {
      // Admin sent message - notify client
      console.log("[onMessageCreated] Admin message - notifying client");

      const clientEmail = ticket.createdBy?.email || ticket.email;
      const clientName = ticket.createdBy?.name || "User";
      const clientId = ticket.createdBy?.id || ticket.userId;

      if (clientEmail) {
        const notification: NotificationDoc = {
          recipientType: "user",
          recipientId: clientId || null,
          recipientEmail: clientEmail,
          recipientName: clientName,
          category: "support",
          type: "ticket_message",
          title: `Response to Your Ticket: ${ticket.subject}`,
          body: `${message.senderName || "Support"} replied: "${truncateMessage(message.body)}"`,
          sourceType: "ticket",
          sourceId: ticketId,
          companyId: ticket.companyId,
          actionUrl: `/app/support?ticketId=${ticketId}`,
          actionLabel: "View Response",
          priority: "normal",
          read: false,
          dismissed: false,
          emailSent: false,
          createdAt: now,
        };

        await db.collection("notifications").add(notification);
        console.log(`[onMessageCreated] Created notification for client ${clientEmail}`);
      } else {
        console.warn(`[onMessageCreated] No client email found for ticket ${ticketId}`);
      }
    }
  }
);
