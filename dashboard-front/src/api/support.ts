// src/api/support.ts
import { http } from "../lib/http-instance";
import type { ApiResponse } from "../types/types";
import type {
    TicketListItem,
    SupportTicket,
    TicketMessage,
    CreateTicketPayload,
    AddMessagePayload,
    TicketAttachment,
} from "../pages/support/types";

// ============================================
// API RESPONSE TYPES
// ============================================

interface TicketDetailData {
    ticket: SupportTicket;
    messages: TicketMessage[];
}

interface TicketStats {
    total: number;
    open: number;
    inProgress: number;
    awaitingResponse: number;
    resolved: number;
    closed: number;
    stale: number;
    highPriority: number;
    criticalPriority: number;
}

interface NudgeResponse {
    ticketId: string;
    nudged: boolean;
    nextNudgeAvailable: string;
}

interface RegisterAttachmentPayload {
    filename: string;
    mimeType: string;
    size: number;
    url: string;
}

// ============================================
// TICKET OPERATIONS
// ============================================

/**
 * Get all tickets for the current company
 * @param filters Optional filters (status, priority, type, limit)
 */
export async function getTickets(filters?: {
    status?: string;
    priority?: string;
    type?: string;
    limit?: number;
}): Promise<TicketListItem[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.limit) params.append("limit", String(filters.limit));

    const queryString = params.toString();
    const url = `/support/tickets${queryString ? `?${queryString}` : ""}`;

    const { data } = await http.get<ApiResponse<TicketListItem[]>>(url);
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to fetch tickets");
    }
    return data.data ?? [];
}

/**
 * Get a single ticket by ID with its messages
 */
export async function getTicketById(ticketId: string): Promise<TicketDetailData> {
    const { data } = await http.get<ApiResponse<TicketDetailData>>(
        `/support/tickets/${ticketId}`
    );
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to fetch ticket");
    }
    return data.data!;
}

/**
 * Create a new support ticket
 */
export async function createTicket(payload: CreateTicketPayload): Promise<SupportTicket> {
    const { data } = await http.post<ApiResponse<SupportTicket>>(
        "/support/tickets",
        payload
    );
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to create ticket");
    }
    return data.data!;
}

/**
 * Add a message to an existing ticket
 */
export async function addMessage(
    ticketId: string,
    payload: Omit<AddMessagePayload, "ticketId">
): Promise<TicketMessage> {
    const { data } = await http.post<ApiResponse<TicketMessage>>(
        `/support/tickets/${ticketId}/messages`,
        payload
    );
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to send message");
    }
    return data.data!;
}

/**
 * Nudge a ticket to get attention
 */
export async function nudgeTicket(
    ticketId: string,
    message?: string
): Promise<NudgeResponse> {
    const { data } = await http.post<ApiResponse<NudgeResponse>>(
        `/support/tickets/${ticketId}/nudge`,
        { message }
    );
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to nudge ticket");
    }
    return data.data!;
}

/**
 * Get ticket statistics for the dashboard
 */
export async function getTicketStats(): Promise<TicketStats> {
    const { data } = await http.get<ApiResponse<TicketStats>>(
        "/support/tickets/stats"
    );
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to fetch ticket stats");
    }
    return data.data!;
}

// ============================================
// ATTACHMENT OPERATIONS
// ============================================

/**
 * Register an uploaded attachment
 * Call this after uploading a file to Firebase Storage
 */
export async function registerAttachment(
    payload: RegisterAttachmentPayload
): Promise<TicketAttachment> {
    const { data } = await http.post<ApiResponse<TicketAttachment>>(
        "/support/attachments",
        payload
    );
    if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Failed to register attachment");
    }
    return data.data!;
}
