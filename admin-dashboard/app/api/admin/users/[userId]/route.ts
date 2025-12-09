import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getUserDetail, suspendUser, reinstateUser, triggerPasswordReset, forceLogout } from "@trogern/domain";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getServerSession();
    const { userId } = await params;

    const detail = await getUserDetail(userId);

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching user detail:", error);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getServerSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { action, reason } = body;

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
