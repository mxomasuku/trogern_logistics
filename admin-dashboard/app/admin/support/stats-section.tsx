"use client"
import {

    Clock,
    AlertCircle,
    CheckCircle,

} from "lucide-react";
import { StatCard, StatsGrid } from "@/components/ui/stats";


type StatsSectionProps = {
    mockStats: any
}

export function StatsSection({ mockStats }: StatsSectionProps) {
    return (
        <StatsGrid columns={4}>
            <StatCard
                title="Open Tickets"
                value={mockStats.open.toString()}
                icon={<AlertCircle className="w-5 h-5 text-warning-600" />}
                iconBg="bg-warning-100"
            />
            <StatCard
                title="In Progress"
                value={mockStats.inProgress.toString()}
                icon={<Clock className="w-5 h-5 text-info-600" />}
                iconBg="bg-info-100"
            />
            <StatCard
                title="High Priority"
                value={mockStats.highPriority.toString()}
                icon={<AlertCircle className="w-5 h-5 text-error-600" />}
                iconBg="bg-error-100"
            />
            <StatCard
                title="Resolved (30d)"
                value={mockStats.closed.toString()}
                icon={<CheckCircle className="w-5 h-5 text-success-600" />}
                iconBg="bg-success-100"
            />
        </StatsGrid>
    );
}