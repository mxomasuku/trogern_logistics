import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { 
  getSubscriptionsPage, 
  getSubscriptionDetail,
  changePlan, 
  cancelSubscription, 
  reactivateSubscription,
  applyFreeTrial,
  getPlans 
} from "@trogern/domain";

export async function GET(request: NextRequest) {
  try {
    const admin = await getServerSession();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any || undefined;
    const planId = searchParams.get("planId") || undefined;
    const companyId = searchParams.get("companyId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const startAfter = searchParams.get("startAfter") || undefined;

    const [subscriptions, plans] = await Promise.all([
      getSubscriptionsPage({
        status,
        planId,
        companyId,
        limit,
        startAfter,
        orderBy: "createdAt",
        orderDirection: "desc",
      }),
      getPlans(),
    ]);

    return NextResponse.json({ ...subscriptions, plans });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getServerSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, subscriptionId, companyId, newPlanId, trialEndDate, immediate } = body;

    let result;

    switch (action) {
      case "change_plan":
        if (!subscriptionId || !newPlanId) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        result = await changePlan(subscriptionId, newPlanId, admin);
        break;
      
      case "cancel":
        if (!subscriptionId) {
          return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 });
        }
        result = await cancelSubscription(subscriptionId, admin, immediate);
        break;
      
      case "reactivate":
        if (!subscriptionId) {
          return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 });
        }
        result = await reactivateSubscription(subscriptionId, admin);
        break;
      
      case "apply_trial":
        if (!companyId || !trialEndDate) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        result = await applyFreeTrial(companyId, new Date(trialEndDate), admin, newPlanId);
        break;
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error performing subscription action:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Action failed" },
      { status: 500 }
    );
  }
}
