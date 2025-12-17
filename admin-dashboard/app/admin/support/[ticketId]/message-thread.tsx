"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Badge, Button } from "@/components/ui/index";
import { Textarea, Label, FormGroup } from "@/components/ui/form";
import { formatRelativeTime } from "@/lib/utils";
import { Send, FileText, Loader2, Paperclip, Image as ImageIcon, ExternalLink } from "lucide-react";
import type { SupportMessage, TicketAttachment } from "@trogern/domain";

interface MessageThreadProps {
    messages: SupportMessage[];
    ticketId: string;
    ticketStatus: string;
}

function formatTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    // Handle ISO string (from serialization)
    if (typeof timestamp === "string") return new Date(timestamp);
    // Fallback for Firestore Timestamp objects
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentDisplay({ attachments }: { attachments: TicketAttachment[] }) {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t border-neutral-200">
            <p className="text-xs font-medium text-neutral-500 mb-2 flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                Attachments ({attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                    <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-neutral-200 hover:border-electric-300 hover:bg-electric-50 transition-colors text-xs"
                    >
                        {att.mimeType.startsWith("image/") ? (
                            <>
                                <ImageIcon className="w-4 h-4 text-electric-500" />
                                <span className="text-neutral-700 max-w-[100px] truncate">{att.filename}</span>
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4 text-error-500" />
                                <span className="text-neutral-700 max-w-[100px] truncate">{att.filename}</span>
                            </>
                        )}
                        <span className="text-neutral-400">{formatFileSize(att.size)}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                ))}
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: SupportMessage }) {
    const isAdmin = message.senderType === "admin";
    const isInternal = message.isInternalNote;
    const hasAttachments = message.attachments && message.attachments.length > 0;

    return (
        <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[70%] rounded-lg p-4 ${isInternal
                    ? "bg-warning-50 border border-warning-200"
                    : isAdmin
                        ? "bg-electric-50 border border-electric-200"
                        : "bg-neutral-100"
                    }`}
            >
                <div className="flex items-center gap-2 mb-2">
                    <span
                        className={`text-sm font-medium ${isInternal
                            ? "text-warning-700"
                            : isAdmin
                                ? "text-electric-700"
                                : "text-neutral-700"
                            }`}
                    >
                        {message.senderName || (isAdmin ? "Admin" : "User")}
                    </span>
                    {isInternal && (
                        <Badge variant="warning" className="text-xs">
                            Internal Note
                        </Badge>
                    )}
                    {hasAttachments && (
                        <Paperclip className="w-3 h-3 text-neutral-400" />
                    )}
                </div>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{message.body}</p>

                {/* Display attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <AttachmentDisplay attachments={message.attachments as TicketAttachment[]} />
                )}

                <p className="text-xs text-neutral-500 mt-2">
                    {formatRelativeTime(formatTimestamp(message.createdAt))}
                </p>
            </div>
        </div>
    );
}

export function MessageThread({ messages, ticketId, ticketStatus }: MessageThreadProps) {
    const router = useRouter();
    const [replyText, setReplyText] = useState("");
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isTicketClosed = ["closed", "resolved", "duplicate"].includes(ticketStatus);

    const handleSubmit = async () => {
        if (!replyText.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {

           
            const res = await fetch(`/api/admin/support/${ticketId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "reply",
                    message: replyText.trim(),
                    isInternalNote,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to send message");
            }

            setReplyText("");
            setIsInternalNote(false);
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Message Thread */}
            <Card padding="md">
                <CardTitle className="mb-4">Conversation ({messages.length} messages)</CardTitle>
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                        No messages yet. Start the conversation below.
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                    </div>
                )}
            </Card>

            {/* Reply form */}
            {!isTicketClosed ? (
                <Card padding="md">
                    <CardTitle className="mb-4">Reply</CardTitle>

                    {error && (
                        <div className="mb-4 p-2 bg-error-50 text-error-700 text-sm rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <FormGroup>
                            <Label>Message</Label>
                            <Textarea
                                rows={4}
                                placeholder="Type your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </FormGroup>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-neutral-300"
                                    checked={isInternalNote}
                                    onChange={(e) => setIsInternalNote(e.target.checked)}
                                    disabled={isSubmitting}
                                />
                                <span>Mark as internal note (not visible to user)</span>
                            </label>
                            <div className="flex gap-2">
                                <Button
                                    variant={isInternalNote ? "primary" : "outline"}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !replyText.trim()}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isInternalNote ? (
                                        <FileText className="w-4 h-4" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {isInternalNote ? "Add Note" : "Send Reply"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ) : (
                <Card padding="md">
                    <div className="text-center py-4 text-neutral-500">
                        This ticket is {ticketStatus}. Reopen to continue the conversation.
                    </div>
                </Card>
            )}
        </>
    );
}
