import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getSupportTicketsPage, getTicketStats } from "@trogern/domain";

export async function GET(request: NextRequest) {
  try {
    const admin = await getServerSession();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any || undefined;
    const priority = searchParams.get("priority") as any || undefined;
    const companyId = searchParams.get("companyId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const startAfter = searchParams.get("startAfter") || undefined;

    const [tickets, stats] = await Promise.all([
      getSupportTicketsPage({
        status,
        priority,
        companyId,
        userId,
        limit,
        startAfter,
        orderBy: "createdAt",
        orderDirection: "desc",
      }),
      getTicketStats(),
    ]);

    return NextResponse.json({ ...tickets, stats });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
