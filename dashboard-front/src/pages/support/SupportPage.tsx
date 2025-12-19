// src/pages/support/SupportPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type {
    TicketType,
    CreateTicketPayload,
    SupportTicket,
    TicketMessage,
    TicketListItem,
    AddMessagePayload,
    NudgeTicketPayload
} from "./types";
import { TICKET_TYPES } from "./mockData";
import {
    SupportHeader,
    TicketTypeCards,
    NewTicketForm,
    TicketList,
    ContactCard,
    TicketDetailView,
} from "./components";
import {
    getTickets,
    getTicketById,
    createTicket,
    addMessage,
    nudgeTicket,
    registerAttachment,
} from "../../api/support";
import { useAuth } from "../../state/AuthContext";
import { uploadTempAttachment, type UploadResult } from "../../lib/storage";

export default function SupportPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const ticketIdParam = searchParams.get("ticketId");

    // Ticket list state
    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(true);
    const [ticketsError, setTicketsError] = useState<string | null>(null);

    // New ticket form state
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [initialType, setInitialType] = useState<TicketType | "">("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ticket detail state
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(ticketIdParam);
    const [ticketDetail, setTicketDetail] = useState<{ ticket: SupportTicket; messages: TicketMessage[] } | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isNudging, setIsNudging] = useState(false);

    // Current user info (from auth context)
    const currentUserId = user?.uid ?? "";
    const currentUserName = user?.displayName ?? user?.email?.split("@")[0] ?? "User";

    // Load tickets on mount
    const loadTickets = useCallback(async () => {
        setIsLoadingTickets(true);
        setTicketsError(null);
        try {
            const data = await getTickets();
            setTickets(data);
        } catch (error: any) {
            console.error("Error loading tickets:", error);
            setTicketsError(error.message ?? "Failed to load tickets");
        } finally {
            setIsLoadingTickets(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Load ticket detail when selected
    useEffect(() => {
        if (!selectedTicketId) {
            setTicketDetail(null);
            return;
        }

        const loadDetail = async () => {
            setIsLoadingDetail(true);
            try {
                const data = await getTicketById(selectedTicketId);
                setTicketDetail(data);
            } catch (error: any) {
                console.error("Error loading ticket detail:", error);
                toast.error("Failed to load ticket details. Please try again.");
                setSelectedTicketId(null);
            } finally {
                setIsLoadingDetail(false);
            }
        };

        loadDetail();
    }, [selectedTicketId]);

    const handleTypeSelect = (type: TicketType) => {
        setInitialType(type);
        setShowNewTicket(true);
    };

    const handleSubmit = async (payload: CreateTicketPayload, files?: File[]) => {
        setIsSubmitting(true);
        try {
            const attachmentIds: string[] = [];

            // Upload files if provided
            if (files && files.length > 0 && user?.uid) {
                toast.loading("Uploading attachments...", { id: "upload-progress" });

                const uploadResults: UploadResult[] = [];
                const uploadErrors: string[] = [];

                for (let i = 0; i < files.length; i++) {
                    try {
                        const result = await uploadTempAttachment(files[i], user.uid);
                        uploadResults.push(result);
                        toast.loading(`Uploaded ${i + 1}/${files.length} files...`, { id: "upload-progress" });
                    } catch (error: any) {
                        console.error(`Error uploading ${files[i].name}:`, error);
                        uploadErrors.push(files[i].name);
                    }
                }

                // Dismiss loading toast
                toast.dismiss("upload-progress");

                // Show success/error for uploads
                if (uploadResults.length > 0) {
                    toast.success(`${uploadResults.length} file${uploadResults.length > 1 ? "s" : ""} uploaded successfully!`);
                }
                if (uploadErrors.length > 0) {
                    toast.error(`Failed to upload: ${uploadErrors.join(", ")}`);
                }

                // Register attachments with backend and get IDs
                for (const result of uploadResults) {
                    try {
                        const registered = await registerAttachment({
                            filename: result.filename,
                            mimeType: result.mimeType,
                            size: result.size,
                            url: result.url,
                        });
                        attachmentIds.push(registered.id);
                    } catch (error) {
                        console.error("Error registering attachment:", error);
                    }
                }
            }

            // Create ticket with attachment IDs
            await createTicket({
                ...payload,
                attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
            });

            // Reset form and reload tickets
            setShowNewTicket(false);
            setInitialType("");
            await loadTickets();

            toast.success("Ticket submitted successfully! Our team will respond shortly.", {
                duration: 5000,
            });
        } catch (error: any) {
            console.error("Error submitting ticket:", error);
            toast.error(error.message ?? "Failed to submit ticket. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setShowNewTicket(false);
        setInitialType("");
    };

    const handleNewTicket = () => {
        setShowNewTicket(true);
    };

    const handleTicketClick = (ticketId: string) => {
        setSelectedTicketId(ticketId);
    };

    const handleBackFromDetail = () => {
        setSelectedTicketId(null);
        setTicketDetail(null);
        // Refresh ticket list in case status changed
        loadTickets();
    };

    const handleSendMessage = async (payload: AddMessagePayload) => {
        if (!selectedTicketId) return;

        setIsSending(true);
        try {
            const newMessage = await addMessage(selectedTicketId, {
                content: payload.content,
                attachmentIds: payload.attachmentIds,
            });

            // Add the new message to the local state
            if (ticketDetail) {
                setTicketDetail({
                    ...ticketDetail,
                    messages: [...ticketDetail.messages, newMessage],
                });
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            toast.error(error.message ?? "Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleNudge = async (payload: NudgeTicketPayload) => {
        setIsNudging(true);
        try {
            await nudgeTicket(payload.ticketId, payload.message);

            // Reload ticket detail to get updated nudge count
            if (selectedTicketId) {
                const data = await getTicketById(selectedTicketId);
                setTicketDetail(data);
            }

            toast.success("Nudge sent! Our team has been notified.");
        } catch (error: any) {
            console.error("Error nudging:", error);
            toast.error(error.message ?? "Failed to nudge. Please try again.");
        } finally {
            setIsNudging(false);
        }
    };

    // Loading state for ticket detail
    if (selectedTicketId && isLoadingDetail) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading ticket details...</p>
                </div>
            </div>
        );
    }

    // If viewing a specific ticket, show detail view
    if (selectedTicketId && ticketDetail) {
        return (
            <div className="p-6">
                <TicketDetailView
                    ticket={ticketDetail.ticket}
                    messages={ticketDetail.messages}
                    ticketTypes={TICKET_TYPES}
                    onBack={handleBackFromDetail}
                    onSendMessage={handleSendMessage}
                    onNudge={handleNudge}
                    isSending={isSending}
                    isNudging={isNudging}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <SupportHeader />

            {/* Quick Action Cards - Hidden when form is open */}
            {!showNewTicket && (
                <TicketTypeCards
                    ticketTypes={TICKET_TYPES}
                    onSelect={handleTypeSelect}
                />
            )}

            {/* New Ticket Form */}
            {showNewTicket && (
                <NewTicketForm
                    initialType={initialType as TicketType}
                    ticketTypes={TICKET_TYPES}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Existing Tickets */}
            {isLoadingTickets ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading tickets...</p>
                    </div>
                </div>
            ) : ticketsError ? (
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">{ticketsError}</p>
                    <button
                        onClick={loadTickets}
                        className="text-blue-600 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <TicketList
                    tickets={tickets}
                    ticketTypes={TICKET_TYPES}
                    onNewTicket={handleNewTicket}
                    onTicketClick={handleTicketClick}
                    showNewButton={!showNewTicket}
                />
            )}

            {/* Contact Info */}
            <ContactCard />
        </div>
    );
}
