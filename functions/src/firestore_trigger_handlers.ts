import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import type {
  ServiceItemKind,
  ServiceItem,
  ServiceItemPrime,
  ServiceRecord,
  VehicleServiceTrackerItemDoc,
  VehicleServiceTrackerSummary,
} from "./interfaces.js";

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < array.length; index += chunkSize) {
    result.push(array.slice(index, index + chunkSize));
  }
  return result;
}

function buildItemKey(kind: ServiceItemKind, name: string): string {
  return `${kind}::${name.trim().toLowerCase()}`;
}

function computeDueValues(
  serviceRecordDate: FirebaseFirestore.Timestamp,
  serviceRecordMileage: number,
  item: ServiceItem,
  catalog: ServiceItemPrime | null
): { dueMileage: number | null; dueDate: FirebaseFirestore.Timestamp | null } {
  const lifespanMileage =
    catalog?.expectedLifespanMileage ??
    item.expectedLifespanMileage ??
    null;

  const lifespanDays =
    catalog?.expectedLifespanDays ??
    item.expectedLifespanDays ??
    null;

  const dueMileage =
    lifespanMileage != null ?
      serviceRecordMileage + lifespanMileage :
      null;

  let dueDate: FirebaseFirestore.Timestamp | null = null;
  if (lifespanDays != null) {
    const baseDate = serviceRecordDate.toDate();
    baseDate.setDate(baseDate.getDate() + lifespanDays);
    dueDate = Timestamp.fromDate(baseDate);
  }

  return {dueMileage, dueDate};
}

// HIGHLIGHT: pass companyId into catalog preload so it stays tenant-scoped
async function preloadCatalogForItems(
  db: FirebaseFirestore.Firestore,
  items: ServiceItem[],
  companyId: string            // HIGHLIGHT
): Promise<Map<string, ServiceItemPrime>> {
  const catalogByKey = new Map<string, ServiceItemPrime>();

  if (items.length === 0) return catalogByKey;

  const distinctNames = Array.from(new Set(items.map((item) => item.name.trim())));
  const nameBatches = chunkArray(distinctNames, 10);

  for (const nameBatch of nameBatches) {
    const snapshot = await db
      .collection("service-items")
      // HIGHLIGHT: company-scoped catalog lookup
      .where("companyId", "==", companyId) // HIGHLIGHT
      .where("name", "in", nameBatch)
      .get();

    snapshot.forEach((doc) => {
      const data = doc.data() as ServiceItemPrime;
      const key = buildItemKey(data.kind, data.name);
      catalogByKey.set(key, data);
    });
  }

  return catalogByKey;
}

export const createOrUpdateVehicleServiceRecord = onDocumentCreated(
  {
    document: "service-and-license-records/{serviceRecordId}",
  },
  async (event) => {
    const db = getFirestore();

    try {
      if (!event.data) {
        logger.warn("No data in service record create event", event.params);
        return;
      }

      const serviceRecordId = event.params.serviceRecordId;
      const serviceRecord = event.data.data() as ServiceRecord | undefined;

      if (!serviceRecord) {
        logger.warn("Service record document has no data", {serviceRecordId});
        return;
      }

      // HIGHLIGHT: pull companyId from the service record
      const {vehicleId, date, serviceMileage, companyId} = serviceRecord; // HIGHLIGHT

      if (!vehicleId) {
        logger.warn("Service record missing vehicleId", {serviceRecordId});
        return;
      }

      if (!companyId) {
        logger.warn("Service record missing companyId", {serviceRecordId});
        return;
      }

      // -------------------- LOAD ITEMS FROM SUBCOLLECTION --------------------
      const itemsSnapshot = await event.data.ref.collection("items").get();

      const itemsChanged: ServiceItem[] = itemsSnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          kind: data.kind as ServiceItemKind,
          // HIGHLIGHT: force companyId on each item (fallback to serviceRecord.companyId)
          companyId: (data.companyId as string) ?? companyId, // HIGHLIGHT
          name: data.name,
          value: data.value,
          unit: data.unit,
          quantity: data.quantity,
          cost: data.cost,
          date: (data.date ?? date) as FirebaseFirestore.Timestamp,
          vehicleMileage: (data.vehicleMileage ?? serviceMileage),
          expectedLifespanMileage: data.expectedLifespanMileage ?? undefined,
          expectedLifespanDays: data.expectedLifespanDays ?? undefined,
        };
      });

      if (itemsChanged.length === 0) {
        logger.info("No items found in items subcollection; skipping", {
          serviceRecordId,
          vehicleId,
        });
        return;
      }
      // -----------------------------------------------------------------------

      logger.info("Processing service record for vehicle", {
        serviceRecordId,
        vehicleId,
        companyId,                            // HIGHLIGHT
        itemCount: itemsChanged.length,
      });

      // HIGHLIGHT: company-scoped catalog
      const catalogByKey = await preloadCatalogForItems(db, itemsChanged, companyId); // HIGHLIGHT

      const trackerSummaryRef = db
        .collection("vehicleServiceTracker")
        .doc(vehicleId);

      const now = Timestamp.now();

      // ------------------------ UPDATE SUMMARY DOC ---------------------------
      await db.runTransaction(async (transaction) => {
        const summarySnapshot = await transaction.get(trackerSummaryRef);

        const existingSummary = summarySnapshot.exists ?
          (summarySnapshot.data() as VehicleServiceTrackerSummary) :
          null;

        const currentLastServiceDate = existingSummary?.lastServiceDate ?? null;
        const currentLastServiceMileage = existingSummary?.lastServiceMileage ?? null;

        const newLastServiceDate =
          !currentLastServiceDate || date.toMillis() > currentLastServiceDate.toMillis() ?
            date :
            currentLastServiceDate;

        const newLastServiceMileage =
          currentLastServiceMileage == null || serviceMileage > currentLastServiceMileage ?
            serviceMileage :
            currentLastServiceMileage;

        const newSummary: VehicleServiceTrackerSummary = {
          vehicleId,
          companyId,                    // HIGHLIGHT
          lastServiceDate: newLastServiceDate,
          lastServiceMileage: newLastServiceMileage,
          updatedAt: now,
        };

        transaction.set(trackerSummaryRef, newSummary, {merge: true});
      });
      // -----------------------------------------------------------------------

      // --------------------- WRITE EACH ITEM (SEQUENTIALLY) ------------------
      for (const item of itemsChanged) {
        const itemKey = buildItemKey(item.kind, item.name);
        const itemRef = trackerSummaryRef.collection("items").doc(itemKey);

        const catalog = catalogByKey.get(itemKey) ?? null;

        const {dueMileage, dueDate} = computeDueValues(
          date,
          serviceMileage,
          item,
          catalog
        );

        const existingItemSnapshot = await itemRef.get();
        const existingItem = existingItemSnapshot.exists ?
          (existingItemSnapshot.data() as VehicleServiceTrackerItemDoc) :
          null;

        const createdAt = existingItem?.createdAt ?? now;

        const updatedItem: VehicleServiceTrackerItemDoc = {
          vehicleId,
          companyId,                      // HIGHLIGHT
          kind: item.kind,
          name: item.name,
          value: item.value,
          lastChangedAt: item.date ?? date,
          lastChangedMileage: item.vehicleMileage ?? serviceMileage,
          dueForChangeOnDate: dueDate,
          dueForChangeOnMileage: dueMileage,
          lastServiceRecordDocId: serviceRecordId,
          createdAt,
          updatedAt: now,
        };

        await itemRef.set(updatedItem, {merge: true});
      }
      // -----------------------------------------------------------------------

      logger.info("Vehicle service tracker updated successfully", {
        vehicleId,
        companyId,                        // HIGHLIGHT
        serviceRecordId,
        itemCount: itemsChanged.length,
      });
    } catch (error) {
      logger.error("Failed to process service record in vehicle tracker", {
        error,
        params: event.params,
      });
      throw error;
    }
  }
);