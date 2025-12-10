// src/pages/support/components/TicketTypeCards.tsx
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import type { TicketType, TicketTypeConfig } from "../types";

interface TicketTypeCardsProps {
    ticketTypes: TicketTypeConfig[];
    onSelect: (type: TicketType) => void;
}

export function TicketTypeCards({ ticketTypes, onSelect }: TicketTypeCardsProps) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ticketTypes.map(({ value, label, icon: Icon, color, description }) => (
                <Card
                    key={value}
                    onClick={() => onSelect(value)}
                    className="group cursor-pointer bg-white hover:bg-blue-50 active:bg-blue-100
                               transition-all duration-200 rounded-xl shadow-sm hover:shadow-md border border-gray-100"
                >
                    <CardHeader className="flex flex-row items-center gap-4 p-4">
                        <div className={`p-3 rounded-xl bg-gray-50 group-hover:bg-white transition-colors ${color}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">
                                {label}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500">
                                {description || "Click to start"}
                            </CardDescription>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </CardHeader>
                </Card>
            ))}
        </section>
    );
}
