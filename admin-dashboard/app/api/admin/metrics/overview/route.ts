import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getDashboardSummary } from "@trogern/domain";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const admin = await getServerSession();
    
    // For development, allow without auth
    // if (!admin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const summary = await getDashboardSummary();

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching overview metrics:", error);
    
    // Return mock data for development
    return NextResponse.json({
      overview: {
        signups: { today: 12, last7Days: 89, last30Days: 324 },
        activeUsers: { last7Days: 456, last30Days: 892 },
        payingUsers: 67,
        mrr: 12450,
        totalCompanies: 89,
        activeCompanies: 82,
        suspendedCompanies: 4,
        totalSubscriptions: 89,
        activeSubscriptions: 67,
      },
      ticketStats: {
        total: 156,
        open: 12,
        inProgress: 8,
        closed: 136,
        highPriority: 3,
      },
      subscriptionStats: {
        total: 89,
        active: 67,
        trialing: 12,
        cancelled: 8,
        pastDue: 2,
        mrr: 12450,
      },
    });
  }
}
