"use client"
import {
    Clock,
    AlertCircle,
    CheckCircle,
    MessageSquare,
} from "lucide-react";
import { StatCard, StatsGrid } from "@/components/ui/stats";

type StatsSectionProps = {
    stats: {
        total: number;
        open: number;
        inProgress: number;
        closed: number;
        highPriority: number;
    };
};

export function StatsSection({ stats }: StatsSectionProps) {
    return (
        <StatsGrid columns={4}>
            <StatCard
                title="Open Tickets"
                value={stats.open.toString()}
                icon={<AlertCircle className="w-5 h-5 text-warning-600" />}
                iconBg="bg-warning-100"
                subtitle="Awaiting response"
            />
            <StatCard
                title="In Progress"
                value={stats.inProgress.toString()}
                icon={<Clock className="w-5 h-5 text-info-600" />}
                iconBg="bg-info-100"
                subtitle="Being worked on"
            />
            <StatCard
                title="High Priority"
                value={stats.highPriority.toString()}
                icon={<AlertCircle className="w-5 h-5 text-error-600" />}
                iconBg="bg-error-100"
                subtitle="Requires attention"
            />
            <StatCard
                title="Resolved"
                value={stats.closed.toString()}
                icon={<CheckCircle className="w-5 h-5 text-success-600" />}
                iconBg="bg-success-100"
                subtitle="Closed tickets"
            />
        </StatsGrid>
    );
}