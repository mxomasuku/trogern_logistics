"use client";

import { StatCard, StatsGrid } from "@/components/ui/stats";
import { formatCurrency } from "@/lib/utils";
import {
    DollarSign,
    CreditCard,
    TrendingUp,
    XCircle,
} from "lucide-react";


type StatsSectionProps = {
    mockStats: any
}

export function StatsSection({ mockStats }: StatsSectionProps) {
    return (
        <StatsGrid columns={4}>
            <StatCard
                title="Monthly Recurring Revenue"
                value={formatCurrency(mockStats.mrr)}
                change={8}
                changeLabel="vs last month"
                icon={<DollarSign className="w-5 h-5 text-success-600" />}
                iconBg="bg-success-100"
            />
            <StatCard
                title="Active Subscriptions"
                value={mockStats.active.toString()}
                icon={<CreditCard className="w-5 h-5 text-electric-600" />}
                iconBg="bg-electric-100"
            />
            <StatCard
                title="Trialing"
                value={mockStats.trialing.toString()}
                icon={<TrendingUp className="w-5 h-5 text-warning-600" />}
                iconBg="bg-warning-100"
            />
            <StatCard
                title="Past Due"
                value={mockStats.pastDue.toString()}
                icon={<XCircle className="w-5 h-5 text-error-600" />}
                iconBg="bg-error-100"
            />
        </StatsGrid>
    );
}