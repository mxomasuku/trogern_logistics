// src/pages/support/types.ts

/**
 * The type/category of a support ticket
 */
export type TicketType = "bug" | "feature" | "question" | "other";

/**
 * Priority level for a support ticket
 */
export type TicketPriority = "low" | "medium" | "high" | "critical";

/**
 * Status of a support ticket
 */
export type TicketStatus =
    | "open"
    | "in_progress"
    | "awaiting_response"  // Admin responded, waiting on client
    | "resolved"           // Fixed but not yet confirmed
    | "closed"             // Confirmed closed
    | "duplicate";         // If linking to another ticket

/**
 * Attachment (screenshots, files)
 */
export interface TicketAttachment {
    id: string;
    url: string;              // Firebase Storage URL
    filename: string;
    mimeType: string;         // image/png, application/pdf, etc.
    size: number;             // bytes
    uploadedAt: string;
    uploadedBy: string;       // userId
}

/**
 * Message in a ticket thread
 * Note: Field names match the backend SupportMessage type
 */
export interface TicketMessage {
    id: string;
    ticketId: string;
    senderType: "user" | "admin";
    senderId?: string;
    senderName?: string;          // Denormalized for display
    body: string;
    attachments?: TicketAttachment[];
    createdAt: string;
    isInternalNote?: boolean;
}

/**
 * Creator info - denormalized for display without extra queries
 */
export interface TicketCreator {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

/**
 * Core support ticket interface
 */
export interface SupportTicket {
    id: string;

    // Content
    subject: string;
    message: string;          // Initial message (first message in thread)
    attachments: TicketAttachment[];  // Initial attachments

    // Classification
    type: TicketType;
    priority: TicketPriority;
    status: TicketStatus;

    // Ownership
    companyId: string;        // Required - which company
    createdBy: TicketCreator; // Who created it (denormalized)
    assignedTo?: string;      // Admin userId
    assignedToName?: string;  // Denormalized admin name

    // Timestamps
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;   // For nudge feature - updates on any message
    resolvedAt?: string;      // When marked resolved

    // Tracking
    messageCount: number;     // Quick count without fetching subcollection

    // Linking (optional)
    duplicateOf?: string;     // ticketId if this is a duplicate

    // Nudge tracking
    lastNudgedAt?: string;    // Prevent spam nudging
    nudgeCount: number;       // How many times client has nudged
}

/**
 * Ticket for display in the list
 */
export interface TicketListItem {
    id: string;
    subject: string;
    type: TicketType;
    priority: TicketPriority;
    status: TicketStatus;
    createdAt: string;
    lastActivityAt?: string;   // More useful than generic "lastUpdate"
    messageCount?: number;
    hasAttachments?: boolean;  // Show paperclip icon
    createdBy?: {
        name: string;
        avatarUrl?: string;
    };
    assignedToName?: string;

    // For staleness indicator in UI
    isStale?: boolean;        // Computed: no activity in X days
}

/**
 * Payload for creating a new ticket
 */
export interface CreateTicketPayload {
    type: TicketType;
    priority: TicketPriority;
    subject: string;
    message: string;
    attachmentIds?: string[]; // IDs of pre-uploaded attachments
}

/**
 * Payload for adding a message to a ticket
 */
export interface AddMessagePayload {
    ticketId: string;
    content: string;
    attachmentIds?: string[];
}

/**
 * Payload for updating ticket (admin actions)
 */
export interface UpdateTicketPayload {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedTo?: string;
    duplicateOf?: string;     // Mark as duplicate
}

/**
 * Nudge payload
 */
export interface NudgeTicketPayload {
    ticketId: string;
    message?: string;         // Optional message with the nudge
}

/**
 * Upload response for attachments
 */
export interface UploadAttachmentResponse {
    isSuccessful: boolean;
    data?: TicketAttachment;
    message?: string;
}

/**
 * Configuration for ticket type display
 */
export interface TicketTypeConfig {
    value: TicketType;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    description?: string;
}

/**
 * Configuration for priority display
 */
export interface TicketPriorityConfig {
    value: TicketPriority;
    label: string;
    color: string;            // For badges/indicators
    bgColor: string;
    sortOrder: number;        // For sorting (critical=0, high=1, etc.)
}

/**
 * Configuration for status display
 */
export interface TicketStatusConfig {
    value: TicketStatus;
    label: string;
    color: string;
    bgColor: string;
    description: string;      // Tooltip explanation
    allowedTransitions: TicketStatus[];  // What statuses can it move to
}

// ============ API Responses ============

export interface CreateTicketResponse {
    isSuccessful: boolean;
    data?: SupportTicket;
    message?: string;
    errorCode?: string;
}

export interface TicketsListResponse {
    isSuccessful: boolean;
    data?: TicketListItem[];
    message?: string;
    errorCode?: string;
}

export interface TicketDetailResponse {
    isSuccessful: boolean;
    data?: {
        ticket: SupportTicket;
        messages: TicketMessage[];
    };
    message?: string;
    errorCode?: string;
}

export interface TicketMessagesResponse {
    isSuccessful: boolean;
    data?: TicketMessage[];
    cursor?: string;          // For pagination
    hasMore: boolean;
    message?: string;
}