// functions/src/triggers/onNotificationCreated.ts
// Trigger that fires when a notification is created, handles email delivery

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { sendEmail, resendApiKey } from "../utils/email";

// Define notification types locally (mirrors @trogern/domain types)
type NotificationCategory = "support" | "service" | "licence" | "income" | "system";
type NotificationPriority = "low" | "normal" | "high" | "urgent";

interface NotificationData {
    recipientType: "user" | "company" | "admin" | "all_admins";
    recipientId: string | null;
    recipientEmail: string;
    recipientName: string;
    category: NotificationCategory;
    type: string;
    title: string;
    body: string;
    sourceType: string;
    sourceId: string | null;
    companyId?: string;
    actionUrl?: string;
    actionLabel?: string;
    priority: NotificationPriority;
    read: boolean;
    dismissed: boolean;
    emailSent: boolean;
    createdAt: Timestamp;
}

/**
 * Trigger: onNotificationCreated
 * 
 * Fires when a new notification document is created in Firestore.
 * Handles email delivery and updates the notification with delivery status.
 */
export const onNotificationCreated = onDocumentCreated(
    {
        document: "notifications/{notificationId}",
        secrets: [resendApiKey], // Required: declare the secret dependency
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }

        const notification = snapshot.data() as NotificationData;
        const notificationId = event.params.notificationId;

        console.log(`[onNotificationCreated] Processing notification ${notificationId}`, {
            type: notification.type,
            recipientType: notification.recipientType,
            recipientEmail: notification.recipientEmail,
        });

        // Skip if email was already sent or no recipient email
        if (notification.emailSent) {
            console.log(`[onNotificationCreated] Email already sent for ${notificationId}`);
            return;
        }

        if (!notification.recipientEmail) {
            console.log(`[onNotificationCreated] No recipient email for ${notificationId}`);
            await snapshot.ref.update({
                emailSent: false,
                emailError: "No recipient email address",
            });
            return;
        }

        // Send email
        try {
            const result = await sendEmail({
                to: notification.recipientEmail,
                toName: notification.recipientName || "User",
                subject: notification.title,
                body: notification.body,
                actionUrl: notification.actionUrl,
                actionLabel: notification.actionLabel,
                priority: notification.priority,
                category: notification.category,
            });

            if (result.success) {
                console.log(`[onNotificationCreated] Email sent successfully for ${notificationId}`, {
                    messageId: result.messageId,
                });

                await snapshot.ref.update({
                    emailSent: true,
                    emailSentAt: Timestamp.now(),
                    emailMessageId: result.messageId,
                });
            } else {
                console.error(`[onNotificationCreated] Failed to send email for ${notificationId}`, {
                    error: result.error,
                });

                await snapshot.ref.update({
                    emailSent: false,
                    emailError: result.error || "Unknown error",
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error(`[onNotificationCreated] Exception sending email for ${notificationId}`, {
                error: errorMessage,
            });

            await snapshot.ref.update({
                emailSent: false,
                emailError: errorMessage,
            });
        }

        // Future: Add push notification sending here
        // if (shouldSendPush(notification)) {
        //   await sendPushNotification(notification);
        // }
    }
);
