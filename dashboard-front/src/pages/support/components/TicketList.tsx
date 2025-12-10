// src/pages/support/components/TicketList.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus } from "lucide-react";
import { TicketCard } from "./TicketCard";
import type { TicketListItem, TicketTypeConfig } from "../types";

interface TicketListProps {
    tickets: TicketListItem[];
    ticketTypes: TicketTypeConfig[];
    onNewTicket?: () => void;
    onTicketClick?: (ticketId: string) => void;
    showNewButton?: boolean;
}

export function TicketList({
    tickets,
    ticketTypes,
    onNewTicket,
    onTicketClick,
    showNewButton = true,
}: TicketListProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Your Tickets</h2>
                {showNewButton && onNewTicket && (
                    <Button
                        onClick={onNewTicket}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        New Ticket
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {tickets.map((ticket) => (
                    <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        ticketTypes={ticketTypes}
                        onClick={onTicketClick}
                    />
                ))}
            </div>

            {tickets.length === 0 && (
                <Card className="bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                    <CardContent className="p-8 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-600">No tickets yet</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Create a new ticket to get help from our support team
                        </p>
                    </CardContent>
                </Card>
            )}
        </section>
    );
}
