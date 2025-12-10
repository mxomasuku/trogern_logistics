// src/pages/support/mockData.ts
import type { TicketListItem, TicketTypeConfig, TicketPriorityConfig, TicketStatusConfig, TicketMessage } from "./types";
import { Bug, Lightbulb, HelpCircle, MessageCircle } from "lucide-react";

/**
 * Mock tickets for UI development and testing
 */
export const MOCK_TICKETS: TicketListItem[] = [
    {
        id: "TKT-001",
        subject: "Cannot add new vehicle",
        status: "open",
        priority: "high",
        type: "bug",
        createdAt: "2024-12-10",
        lastActivityAt: "2024-12-10",
        messageCount: 3,
        hasAttachments: true,
        createdBy: {
            name: "John Doe",
            avatarUrl: undefined,
        },
        isStale: false,
    },
    {
        id: "TKT-002",
        subject: "Request: Export reports to PDF",
        status: "in_progress",
        priority: "medium",
        type: "feature",
        createdAt: "2024-12-08",
        lastActivityAt: "2024-12-09",
        messageCount: 5,
        hasAttachments: false,
        createdBy: {
            name: "Jane Smith",
            avatarUrl: undefined,
        },
        assignedToName: "Support Team",
        isStale: false,
    },
    {
        id: "TKT-003",
        subject: "How to add multiple drivers?",
        status: "awaiting_response",
        priority: "low",
        type: "question",
        createdAt: "2024-12-05",
        lastActivityAt: "2024-12-06",
        messageCount: 2,
        hasAttachments: false,
        createdBy: {
            name: "Bob Johnson",
            avatarUrl: undefined,
        },
        isStale: true,
    },
    {
        id: "TKT-004",
        subject: "Critical: App crashes on login",
        status: "in_progress",
        priority: "critical",
        type: "bug",
        createdAt: "2024-12-11",
        lastActivityAt: "2024-12-11",
        messageCount: 8,
        hasAttachments: true,
        createdBy: {
            name: "Alice Williams",
            avatarUrl: undefined,
        },
        assignedToName: "Dev Team",
        isStale: false,
    },
    {
        id: "TKT-005",
        subject: "Feature already addressed in TKT-002",
        status: "duplicate",
        priority: "medium",
        type: "feature",
        createdAt: "2024-12-09",
        lastActivityAt: "2024-12-09",
        messageCount: 1,
        hasAttachments: false,
        createdBy: {
            name: "Charlie Brown",
            avatarUrl: undefined,
        },
        isStale: false,
    },
    {
        id: "TKT-006",
        subject: "GPS tracking issue resolved",
        status: "resolved",
        priority: "high",
        type: "bug",
        createdAt: "2024-12-01",
        lastActivityAt: "2024-12-08",
        messageCount: 12,
        hasAttachments: true,
        createdBy: {
            name: "Diana Prince",
            avatarUrl: undefined,
        },
        isStale: false,
    },
];

/**
 * Mock messages for a ticket thread (kept for fallback/testing)
 */
export const MOCK_MESSAGES: TicketMessage[] = [
    {
        id: "MSG-001",
        ticketId: "TKT-001",
        body: "I'm trying to add a new vehicle but the save button doesn't respond when I click it.",
        senderId: "user-123",
        senderName: "John Doe",
        senderType: "user",
        attachments: [
            {
                id: "ATT-001",
                url: "https://example.com/screenshot1.png",
                filename: "screenshot1.png",
                mimeType: "image/png",
                size: 245000,
                uploadedAt: "2024-12-10T10:30:00Z",
                uploadedBy: "user-123",
            }
        ],
        createdAt: "2024-12-10T10:30:00Z",
        isInternalNote: false,
    },
    {
        id: "MSG-002",
        ticketId: "TKT-001",
        body: "Thank you for reporting this. Can you please tell us which browser you're using?",
        senderId: "admin-456",
        senderName: "Support Team",
        senderType: "admin",
        attachments: [],
        createdAt: "2024-12-10T11:15:00Z",
        isInternalNote: false,
    },
    {
        id: "MSG-003",
        ticketId: "TKT-001",
        body: "I'm using Chrome version 119. I also tried Firefox and had the same issue.",
        senderId: "user-123",
        senderName: "John Doe",
        senderType: "user",
        attachments: [],
        createdAt: "2024-12-10T11:45:00Z",
        isInternalNote: false,
    },
];

/**
 * Ticket type configurations for UI display
 */
export const TICKET_TYPES: TicketTypeConfig[] = [
    {
        value: "bug",
        label: "Report a Bug",
        icon: Bug,
        color: "text-red-500",
        description: "Something isn't working correctly",
    },
    {
        value: "feature",
        label: "Request a Feature",
        icon: Lightbulb,
        color: "text-amber-500",
        description: "Suggest a new feature or improvement",
    },
    {
        value: "question",
        label: "Ask a Question",
        icon: HelpCircle,
        color: "text-blue-500",
        description: "Get help with using the platform",
    },
    {
        value: "other",
        label: "Other",
        icon: MessageCircle,
        color: "text-gray-500",
        description: "General inquiry or feedback",
    },
];

/**
 * Priority configurations for UI display
 */
export const PRIORITY_CONFIG: TicketPriorityConfig[] = [
    {
        value: "critical",
        label: "Critical",
        color: "text-purple-700",
        bgColor: "bg-purple-100",
        sortOrder: 0,
    },
    {
        value: "high",
        label: "High",
        color: "text-red-700",
        bgColor: "bg-red-100",
        sortOrder: 1,
    },
    {
        value: "medium",
        label: "Medium",
        color: "text-amber-700",
        bgColor: "bg-amber-100",
        sortOrder: 2,
    },
    {
        value: "low",
        label: "Low",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        sortOrder: 3,
    },
];

/**
 * Status configurations for UI display
 */
export const STATUS_CONFIG: TicketStatusConfig[] = [
    {
        value: "open",
        label: "Open",
        color: "text-amber-700",
        bgColor: "bg-amber-100",
        description: "Ticket is awaiting review",
        allowedTransitions: ["in_progress", "closed", "duplicate"],
    },
    {
        value: "in_progress",
        label: "In Progress",
        color: "text-blue-700",
        bgColor: "bg-blue-100",
        description: "Our team is working on this",
        allowedTransitions: ["awaiting_response", "resolved", "closed"],
    },
    {
        value: "awaiting_response",
        label: "Awaiting Response",
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        description: "Waiting for your reply",
        allowedTransitions: ["in_progress", "resolved", "closed"],
    },
    {
        value: "resolved",
        label: "Resolved",
        color: "text-emerald-700",
        bgColor: "bg-emerald-100",
        description: "Issue has been fixed",
        allowedTransitions: ["closed", "in_progress"],
    },
    {
        value: "closed",
        label: "Closed",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        description: "Ticket is closed",
        allowedTransitions: ["open"],
    },
    {
        value: "duplicate",
        label: "Duplicate",
        color: "text-slate-600",
        bgColor: "bg-slate-100",
        description: "This ticket duplicates another",
        allowedTransitions: [],
    },
];
