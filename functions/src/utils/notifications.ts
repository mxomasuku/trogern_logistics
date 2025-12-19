import {getFirestore, Timestamp} from "firebase-admin/firestore";

// HIGHLIGHT: notification shape used by the helper
export type NotificationSeverity = "info" | "warn" | "critical";
export type NotificationStatus = "open" | "acknowledged" | "resolved";

export interface NotificationDoc {
  companyId: string;
  type: string;
  severity: NotificationSeverity;
  status: NotificationStatus;

  // optional scoping / linking
  vehicleId?: string | null;
  entityType?: string | null;
  entityId?: string | null;

  // display
  title: string;
  message: string;

  // de-duplication + metadata
  dedupeKey: string;
  isOpened: boolean;
  payload?: Record<string, unknown>;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt: Timestamp | null;
}

export interface UpsertNotificationInput {
  companyId: string;
  type: string;

  // optional scoping
  vehicleId?: string;
  entityType?: string;
  entityId?: string;

  // optional display
  title?: string;
  message?: string;

  // optional severity override
  severity?: NotificationSeverity;

  // extra data for UI / debugging
  payload?: Record<string, unknown>;

  // optional explicit dedupe key if you want full control
  dedupeKey?: string;
}

// HIGHLIGHT: core helper used by crons + triggers
export async function upsertNotification(
  input: UpsertNotificationInput
): Promise<void> {
  const db = getFirestore();
  const now = Timestamp.now();

  const {
    companyId,
    type,
    vehicleId,
    entityType,
    entityId,
    title,
    message,
    severity = "warn",
    payload,
    dedupeKey: explicitDedupeKey,
  } = input;

  // HIGHLIGHT: use explicit dedupeKey when provided
  const dedupeKey =
    explicitDedupeKey ??
    [
      companyId,
      type,
      entityType ?? "entity",
      entityId ?? vehicleId ?? "global",
    ].join(":");

  const notificationsCol = db.collection("notifications");

  const existingSnap = await notificationsCol
    .where("companyId", "==", companyId)
    .where("dedupeKey", "==", dedupeKey)
    .limit(1)
    .get();

  if (existingSnap.empty) {
    const doc: NotificationDoc = {
      companyId,
      type,
      severity,
      status: "open",
      vehicleId: vehicleId ?? null,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      // HIGHLIGHT: prefer explicit title, then smarter default
      title:
        title ??
        buildDefaultTitle(
          type,
          entityType,
          entityId ?? vehicleId ?? null,
          payload
        ),
      message: message ?? "",
      dedupeKey,
      isOpened: false,
      payload: payload ?? {},
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    };

    await notificationsCol.add(doc);
    return;
  }

  const existingDocRef = existingSnap.docs[0].ref;
  const existing = existingSnap.docs[0].data() as NotificationDoc;

  const mergedPayload =
    payload != null ?
      {...(existing.payload ?? {}), ...payload} :
      existing.payload ?? {};

  await existingDocRef.update({
    status: "open", // HIGHLIGHT: always re-open on upsert
    severity,
    vehicleId: vehicleId ?? existing.vehicleId ?? null,
    entityType: entityType ?? existing.entityType ?? null,
    entityId: entityId ?? existing.entityId ?? null,
    // HIGHLIGHT: keep existing title if none provided
    title:
      title ??
      existing.title ??
      buildDefaultTitle(
        type,
        entityType ?? existing.entityType ?? null,
        entityId ?? existing.entityId ?? vehicleId ?? existing.vehicleId ?? null,
        mergedPayload
      ),
    message: message ?? existing.message ?? "",
    payload: mergedPayload,
    isOpened: existing.isOpened ?? false,
    updatedAt: now,
    resolvedAt: null,
  });
}

// HIGHLIGHT: smarter default title, using payload.itemName when available
function buildDefaultTitle(
  type: string,
  entityType?: string | null,
  entityId?: string | null,
  payload?: Record<string, unknown>
): string {
  const itemName = (payload?.itemName as string | undefined) ?? null;
  const label =
    itemName ?? (entityType && entityId ? `${entityType} ${entityId}` : "");

  switch (type) {
  // HIGHLIGHT: handle both SOON and OVERDUE explicitly
  case "SERVICE_ITEM_DUE_SOON":
    return label ? `Service due soon: ${label}` : "Service item due soon";
  case "SERVICE_ITEM_OVERDUE":
    return label ? `Service OVERDUE: ${label}` : "Service item OVERDUE";
  case "NO_INCOME_LOGS_8_DAYS":
    return label ?
      `No income logs for ${label} in 8 days` :
      "No income logs in 8 days";
  default:
    return label ? `${type} for ${label}` : type;
  }
}