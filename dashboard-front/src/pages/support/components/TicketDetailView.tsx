// src/pages/support/components/TicketDetailView.tsx
import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Send,
    Bell,
    Paperclip,
    Clock,
    User,
    Image,
    FileText,
    ExternalLink,
    AlertTriangle
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import type {
    SupportTicket,
    TicketMessage,
    TicketTypeConfig,
    AddMessagePayload,
    NudgeTicketPayload
} from "../types";

interface TicketDetailViewProps {
    ticket: SupportTicket;
    messages: TicketMessage[];
    ticketTypes: TicketTypeConfig[];
    onBack: () => void;
    onSendMessage: (payload: AddMessagePayload) => Promise<void>;
    onNudge: (payload: NudgeTicketPayload) => Promise<void>;
    isSending?: boolean;
    isNudging?: boolean;
    currentUserId: string;
    currentUserName: string;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateStr);
}

function canNudge(ticket: SupportTicket): boolean {
    // Can only nudge if ticket is in progress and hasn't been nudged recently
    if (ticket.status !== "in_progress" && ticket.status !== "open") return false;

    if (ticket.lastNudgedAt) {
        const lastNudge = new Date(ticket.lastNudgedAt);
        const hoursSinceNudge = (Date.now() - lastNudge.getTime()) / (1000 * 60 * 60);
        if (hoursSinceNudge < 24) return false; // Only allow nudge once per 24 hours
    }

    return true;
}

export function TicketDetailView({
    ticket,
    messages,
    ticketTypes,
    onBack,
    onSendMessage,
    onNudge,
    isSending = false,
    isNudging = false,
}: TicketDetailViewProps) {
    const [newMessage, setNewMessage] = useState("");

    const typeConfig = ticketTypes.find(t => t.value === ticket.type);
    const TypeIcon = typeConfig?.icon;
    const isCritical = ticket.priority === "critical";
    const isOpen = ticket.status === "open" || ticket.status === "in_progress" || ticket.status === "awaiting_response";

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        await onSendMessage({
            ticketId: ticket.id,
            content: newMessage.trim(),
        });

        setNewMessage("");
    };

    const handleNudge = async () => {
        await onNudge({
            ticketId: ticket.id,
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>
            </div>

            {/* Ticket Info Card */}
            <Card className={`bg-white rounded-xl shadow-sm ${isCritical ? "border-purple-200" : "border-gray-100"}`}>
                <CardHeader className="border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            {TypeIcon && (
                                <div className={`p-2 rounded-lg ${isCritical ? "bg-purple-100" : "bg-gray-50"}`}>
                                    <TypeIcon className={`w-5 h-5 ${typeConfig?.color}`} />
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-mono text-gray-400">{ticket.id}</span>
                                    <StatusBadge status={ticket.status} />
                                    <PriorityBadge priority={ticket.priority} showIcon={isCritical} />
                                </div>
                                <CardTitle className="text-lg font-semibold text-gray-800">
                                    {ticket.subject}
                                </CardTitle>
                            </div>
                        </div>

                        {/* Nudge Button */}
                        {isOpen && canNudge(ticket) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNudge}
                                disabled={isNudging}
                                className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                            >
                                <Bell className="w-4 h-4" />
                                {isNudging ? "Nudging..." : "Nudge"}
                            </Button>
                        )}
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        {ticket.createdBy && (
                            <span className="inline-flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {ticket.createdBy.name}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Created {formatRelativeTime(ticket.createdAt)}
                        </span>
                        {ticket.assignedToName && (
                            <span>Assigned to: {ticket.assignedToName}</span>
                        )}
                        {ticket.nudgeCount !== undefined && ticket.nudgeCount > 0 && (
                            <span className="text-amber-600">
                                Nudged {ticket.nudgeCount}x
                            </span>
                        )}
                    </div>

                    {/* Linked ticket indicator */}
                    {ticket.duplicateOf && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-lg flex items-center gap-2 text-sm text-slate-600">
                            <AlertTriangle className="w-4 h-4" />
                            This ticket is a duplicate of
                            <a href="#" className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                                {ticket.duplicateOf}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </CardHeader>

                {/* Initial message and attachments */}
                <CardContent className="p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>

                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                <Paperclip className="w-4 h-4" />
                                Attachments ({ticket.attachments.length})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ticket.attachments.map(att => (
                                    <a
                                        key={att.id}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border rounded-lg p-2 hover:bg-gray-50 transition-colors"
                                    >
                                        {att.mimeType.startsWith("image/") ? (
                                            <div className="relative">
                                                <img
                                                    src={att.url}
                                                    alt={att.filename}
                                                    className="w-full h-20 object-cover rounded"
                                                />
                                                <Image className="absolute top-1 right-1 w-4 h-4 text-white drop-shadow" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-20 gap-1">
                                                <FileText className="w-8 h-8 text-red-500" />
                                                <span className="text-xs text-gray-500 truncate max-w-full">
                                                    {att.filename}
                                                </span>
                                            </div>
                                        )}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className="bg-white rounded-xl shadow-sm border-gray-100">
                <CardHeader className="border-b border-gray-100 py-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Conversation ({messages.length} messages)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {messages.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No messages yet. Start the conversation below.
                        </p>
                    ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {messages.map(msg => {
                                const isUser = msg.senderType === "user";
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${isUser
                                                ? "bg-blue-50 border border-blue-100"
                                                : "bg-gray-50 border border-gray-100"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-medium ${isUser ? "text-blue-700" : "text-gray-700"}`}>
                                                    {msg.senderName}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatRelativeTime(msg.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {msg.body}
                                            </p>

                                            {/* Message attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {msg.attachments.map(att => (
                                                        <a
                                                            key={att.id}
                                                            href={att.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                        >
                                                            <Paperclip className="w-3 h-3" />
                                                            {att.filename}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Reply box - only show for open tickets */}
                    {isOpen && (
                        <div className="border-t border-gray-100 pt-4 mt-4">
                            <div className="flex gap-2">
                                <Textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 min-h-[80px]"
                                />
                            </div>
                            <div className="flex justify-end mt-2">
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !newMessage.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                >
                                    {isSending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Reply
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Closed ticket notice */}
                    {!isOpen && (
                        <div className="border-t border-gray-100 pt-4 mt-4 text-center text-gray-500">
                            This ticket is {ticket.status}.
                            {ticket.status === "resolved" && " Please confirm if your issue is resolved."}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
