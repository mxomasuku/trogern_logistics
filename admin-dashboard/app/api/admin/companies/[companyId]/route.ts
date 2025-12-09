import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getCompanyDetail, getCompanyStats, suspendCompany, reinstateCompany, deleteCompany } from "@trogern/domain";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const admin = await getServerSession();
    const { companyId } = await params;

    const [detail, stats] = await Promise.all([
      getCompanyDetail(companyId),
      getCompanyStats(companyId),
    ]);

    return NextResponse.json({ ...detail, stats });
  } catch (error) {
    console.error("Error fetching company detail:", error);
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const admin = await getServerSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await params;
    const body = await request.json();
    const { action, reason } = body;

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
