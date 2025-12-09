import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getCompaniesPage, suspendCompany, reinstateCompany, deleteCompany } from "@trogern/domain";

export async function GET(request: NextRequest) {
  try {
    const admin = await getServerSession();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") as any || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const startAfter = searchParams.get("startAfter") || undefined;

    const result = await getCompaniesPage({
      search,
      status,
      limit,
      startAfter,
      orderBy: "createdAt",
      orderDirection: "desc",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getServerSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, companyId, reason } = body;

    let result;

    switch (action) {
      case "suspend":
        result = await suspendCompany(companyId, admin, reason);
        break;
      case "reinstate":
        result = await reinstateCompany(companyId, admin);
        break;
      case "delete":
        result = await deleteCompany(companyId, admin, reason);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error performing company action:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Action failed" },
      { status: 500 }
    );
  }
}
