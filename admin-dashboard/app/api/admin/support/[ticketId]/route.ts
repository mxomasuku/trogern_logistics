import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { 
  getSupportTicketDetail, 
  postTicketMessage, 
  postInternalNote, 
  changeTicketStatus,
  changeTicketPriority,
  assignTicket,
  linkTicketToUser
} from "@trogern/domain";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const admin = await getServerSession();
    const { ticketId } = await params;

    const detail = await getSupportTicketDetail(ticketId);

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching ticket detail:", error);
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const admin = await getServerSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId } = await params;
    const body = await request.json();
    const { action, message, status, priority, assigneeId, userId, isInternalNote } = body;

    let result;

    switch (action) {
      case "reply":
        if (!message) {
          return NextResponse.json({ error: "Message required" }, { status: 400 });
        }
        if (isInternalNote) {
          result = await postInternalNote(ticketId, message, admin);
        } else {
          result = await postTicketMessage(ticketId, message, admin);
        }
        break;
      
      case "change_status":
        if (!status) {
          return NextResponse.json({ error: "Status required" }, { status: 400 });
        }
        result = await changeTicketStatus(ticketId, status, admin);
        break;
      
      case "change_priority":
        if (!priority) {
          return NextResponse.json({ error: "Priority required" }, { status: 400 });
        }
        result = await changeTicketPriority(ticketId, priority, admin);
        break;
      
      case "assign":
        if (!assigneeId) {
          return NextResponse.json({ error: "Assignee required" }, { status: 400 });
        }
        result = await assignTicket(ticketId, assigneeId, admin);
        break;
      
      case "link_user":
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }
        result = await linkTicketToUser(ticketId, userId, admin);
        break;
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error performing ticket action:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Action failed" },
      { status: 500 }
    );
  }
}
