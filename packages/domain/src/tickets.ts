import { getDb, Collections, serverTimestamp } from "./firebaseAdmin";
import {
  SupportTicket,
  SupportMessage,
  TicketFilters,
  PaginatedResult,
  PaginationParams,
  AdminUser,
  AppUser,
  Company,
} from "./types";
import { logTicketAction } from "./audit";
import { ensureRole } from "./rbac";

/**
 * Get paginated list of support tickets with optional filters
 */
export async function getSupportTicketsPage(
  params: TicketFilters & PaginationParams = {}
): Promise<PaginatedResult<SupportTicket & { user?: AppUser; company?: Company }>> {
  const db = getDb();
  const {
    status,
    priority,
    companyId,
    userId,
    limit = 20,
    startAfter,
    orderBy = "createdAt",
    orderDirection = "desc",
  } = params;

  let query = db.collection(Collections.SUPPORT_TICKETS).orderBy(orderBy, orderDirection);

  // Apply filters
  if (status) {
    query = query.where("status", "==", status);
  }

  if (priority) {
    query = query.where("priority", "==", priority);
  }

  if (companyId) {
    query = query.where("companyId", "==", companyId);
  }

  if (userId) {
    query = query.where("userId", "==", userId);
  }

  // Apply pagination
  query = query.limit(limit + 1);

  if (startAfter) {
    const startDoc = await db.collection(Collections.SUPPORT_TICKETS).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;

  const hasMore = docs.length > limit;
  const resultDocs = docs.slice(0, limit);

  const tickets = resultDocs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SupportTicket[];

  // Fetch related data
  const userIds = [...new Set(tickets.map((t) => t.userId).filter(Boolean))];
  const companyIds = [...new Set(tickets.map((t) => t.companyId).filter(Boolean))];

  const usersMap = new Map<string, AppUser>();
  const companiesMap = new Map<string, Company>();

  // Batch fetch users
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    if (batch.length > 0) {
      const usersSnapshot = await db
        .collection(Collections.USERS)
        .where("__name__", "in", batch)
        .get();

      usersSnapshot.docs.forEach((doc) => {
        usersMap.set(doc.id, { uid: doc.id, ...doc.data() } as unknown as AppUser);
      });
    }
  }

  // Batch fetch companies
  for (let i = 0; i < companyIds.length; i += 10) {
    const batch = companyIds.slice(i, i + 10);
    if (batch.length > 0) {
      const companiesSnapshot = await db
        .collection(Collections.COMPANIES)
        .where("__name__", "in", batch)
        .get();

      companiesSnapshot.docs.forEach((doc) => {
        companiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Company);
      });
    }
  }

  const data = tickets.map((ticket) => ({
    ...ticket,
    user: ticket.userId ? usersMap.get(ticket.userId) : undefined,
    company: ticket.companyId ? companiesMap.get(ticket.companyId) : undefined,
  }));

  // Get total count
  const countSnapshot = await db.collection(Collections.SUPPORT_TICKETS).count().get();
  const total = countSnapshot.data().count;

  return {
    data,
    total,
    hasMore,
    nextCursor: hasMore ? resultDocs[resultDocs.length - 1]?.id : undefined,
  };
}

/**
 * Get detailed ticket information including messages
 */
export async function getSupportTicketDetail(ticketId: string): Promise<{
  ticket: SupportTicket;
  user: AppUser | null;
  company: Company | null;
  messages: SupportMessage[];
}> {
  const db = getDb();

  // Get ticket
  const ticketDoc = await db.collection(Collections.SUPPORT_TICKETS).doc(ticketId).get();

  if (!ticketDoc.exists) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  const ticket = { id: ticketDoc.id, ...ticketDoc.data() } as SupportTicket;

  // Get user
  let user: AppUser | null = null;
  if (ticket.userId) {
    const userDoc = await db.collection(Collections.USERS).doc(ticket.userId).get();
    if (userDoc.exists) {
      user = { uid: userDoc.id, ...userDoc.data() } as unknown as AppUser;
    }
  }

  // Get company
  let company: Company | null = null;
  if (ticket.companyId) {
    const companyDoc = await db.collection(Collections.COMPANIES).doc(ticket.companyId).get();
    if (companyDoc.exists) {
      company = { id: companyDoc.id, ...companyDoc.data() } as Company;
    }
  }

  // Get messages
  const messagesSnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .doc(ticketId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  const messages = messagesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ticketId,
    ...doc.data(),
  })) as SupportMessage[];

  return { ticket, user, company, messages };
}

/**
 * Post a message to a ticket (public reply)
 */
export async function postTicketMessage(
  ticketId: string,
  message: string,
  adminUser: AdminUser
): Promise<SupportMessage> {
  ensureRole(adminUser, ["support", "admin", "founder"]);

  const db = getDb();
  const ticketRef = db.collection(Collections.SUPPORT_TICKETS).doc(ticketId);

  // Verify ticket exists
  const ticketDoc = await ticketRef.get();
  if (!ticketDoc.exists) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  // Create message
  const messageRef = ticketRef.collection(Collections.MESSAGES).doc();
  const newMessage: Omit<SupportMessage, "id" | "ticketId"> = {
    senderType: "admin",
    senderId: adminUser.id,
    senderName: adminUser.name || adminUser.email,
    body: message,
    createdAt: serverTimestamp() as any,
    isInternalNote: false,
  };

  await messageRef.set(newMessage);

  // Update ticket
  await ticketRef.update({
    lastUpdatedBy: "admin",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logTicketAction(adminUser, "message_posted", ticketId);

  return { id: messageRef.id, ticketId, ...newMessage } as SupportMessage;
}

/**
 * Post an internal note to a ticket (not visible to user)
 */
export async function postInternalNote(
  ticketId: string,
  note: string,
  adminUser: AdminUser
): Promise<SupportMessage> {
  ensureRole(adminUser, ["support", "admin", "founder"]);

  const db = getDb();
  const ticketRef = db.collection(Collections.SUPPORT_TICKETS).doc(ticketId);

  // Verify ticket exists
  const ticketDoc = await ticketRef.get();
  if (!ticketDoc.exists) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  // Create internal note
  const messageRef = ticketRef.collection("messages").doc();
  const newMessage: Omit<SupportMessage, "id" | "ticketId"> = {
    senderType: "admin",
    senderId: adminUser.id,
    senderName: adminUser.name || adminUser.email,
    body: note,
    createdAt: serverTimestamp() as any,
    isInternalNote: true,
  };

  await messageRef.set(newMessage);

  // Log the action
  await logTicketAction(adminUser, "internal_note_added", ticketId);

  return { id: messageRef.id, ticketId, ...newMessage } as SupportMessage;
}

/**
 * Change ticket status
 */
export async function changeTicketStatus(
  ticketId: string,
  status: SupportTicket["status"],
  adminUser: AdminUser
): Promise<SupportTicket> {
  ensureRole(adminUser, ["support", "admin", "founder"]);

  const db = getDb();
  const ticketRef = db.collection(Collections.SUPPORT_TICKETS).doc(ticketId);

  // Get current status for logging
  const ticketDoc = await ticketRef.get();
  if (!ticketDoc.exists) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  const oldStatus = (ticketDoc.data() as SupportTicket).status;

  await ticketRef.update({
    status,
    lastUpdatedBy: "admin",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logTicketAction(adminUser, "status_changed", ticketId, {
    oldStatus,
    newStatus: status,
  });

  const updated = await ticketRef.get();
  return { id: updated.id, ...updated.data() } as SupportTicket;
}

/**
 * Change ticket priority
 */
export async function changeTicketPriority(
  ticketId: string,
  priority: SupportTicket["priority"],
  adminUser: AdminUser
): Promise<SupportTicket> {
  ensureRole(adminUser, ["support", "admin", "founder"]);

  const db = getDb();
  const ticketRef = db.collection(Collections.SUPPORT_TICKETS).doc(ticketId);

  // Get current priority for logging
  const ticketDoc = await ticketRef.get();
  if (!ticketDoc.exists) {
    throw new Error(`Ticket not found: ${ticketId}`);
  }

  const oldPriority = (ticketDoc.data() as SupportTicket).priority;

  await ticketRef.update({
    priority,
    lastUpdatedBy: "admin",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logTicketAction(adminUser, "priority_changed", ticketId, {
    oldPriority,
    newPriority: priority,
  });

  const updated = await ticketRef.get();
  return { id: updated.id, ...updated.data() } as SupportTicket;
}

/**
 * Assign ticket to admin
 */
export async function assignTicket(
  ticketId: string,
  assigneeId: string,
  adminUser: AdminUser
): Promise<SupportTicket> {
  ensureRole(adminUser, ["support", "admin", "founder"]);

  const db = getDb();
  const ticketRef = db.collection(Collections.SUPPORT_TICKETS).doc(ticketId);

  await ticketRef.update({
    assignedTo: assigneeId,
    lastUpdatedBy: "admin",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logTicketAction(adminUser, "ticket_assigned", ticketId, { assigneeId });

  const updated = await ticketRef.get();
  return { id: updated.id, ...updated.data() } as SupportTicket;
}

/**
 * Link ticket to user account
 */
export async function linkTicketToUser(
  ticketId: string,
  userId: string,
  adminUser: AdminUser
): Promise<SupportTicket> {
  ensureRole(adminUser, ["support", "admin", "founder"]);

  const db = getDb();

  // Verify user exists
  const userDoc = await db.collection(Collections.USERS).doc(userId).get();
  if (!userDoc.exists) {
    throw new Error(`User not found: ${userId}`);
  }

  const user = userDoc.data() as AppUser;

  const ticketRef = db.collection(Collections.SUPPORT_TICKETS).doc(ticketId);

  await ticketRef.update({
    userId,
    companyId: user.companyId,
    lastUpdatedBy: "admin",
    updatedAt: serverTimestamp(),
  });

  // Log the action
  await logTicketAction(adminUser, "ticket_linked_to_user", ticketId, {
    userId,
    companyId: user.companyId,
  });

  const updated = await ticketRef.get();
  return { id: updated.id, ...updated.data() } as SupportTicket;
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<{
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  highPriority: number;
}> {
  const db = getDb();

  const totalSnapshot = await db.collection(Collections.SUPPORT_TICKETS).count().get();
  const openSnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .where("status", "==", "open")
    .count()
    .get();
  const inProgressSnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .where("status", "==", "in_progress")
    .count()
    .get();
  const closedSnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .where("status", "==", "closed")
    .count()
    .get();
  const highPrioritySnapshot = await db
    .collection(Collections.SUPPORT_TICKETS)
    .where("priority", "==", "high")
    .where("status", "in", ["open", "in_progress"])
    .count()
    .get();

  return {
    total: totalSnapshot.data().count,
    open: openSnapshot.data().count,
    inProgress: inProgressSnapshot.data().count,
    closed: closedSnapshot.data().count,
    highPriority: highPrioritySnapshot.data().count,
  };
}
