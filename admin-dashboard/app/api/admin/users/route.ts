import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getUsersPage, suspendUser, reinstateUser, triggerPasswordReset, forceLogout } from "@trogern/domain";

export async function GET(request: NextRequest) {
  try {
    const admin = await getServerSession();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") as any || undefined;
    const role = searchParams.get("role") as any || undefined;
    const companyId = searchParams.get("companyId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const startAfter = searchParams.get("startAfter") || undefined;

    const result = await getUsersPage({
      search,
      status,
      role,
      companyId,
      limit,
      startAfter,
      orderBy: "createdAt",
      orderDirection: "desc",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getServerSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, reason } = body;

    let result;

    switch (action) {
      case "suspend":
        result = await suspendUser(userId, admin, reason);
        break;
      case "reinstate":
        result = await reinstateUser(userId, admin);
        break;
      case "password_reset":
        result = await triggerPasswordReset(userId, admin);
        break;
      case "force_logout":
        result = await forceLogout(userId, admin);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error performing user action:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Action failed" },
      { status: 500 }
    );
  }
}
