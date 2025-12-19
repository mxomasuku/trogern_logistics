import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {getFirestore, Timestamp} from "firebase-admin/firestore";

import type {
  ServiceItemKind,
  ServiceItem,
  ServiceItemPrime,
  ServiceRecord,
  VehicleServiceTrackerDoc,
  VehicleServiceTrackerItemState,
} from "./interfaces";

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
  serviceRecordDate: Timestamp,
  serviceRecordMileage: number,
  item: ServiceItem,
  catalog: ServiceItemPrime | null
): { dueMileage: number | null; dueDate: Timestamp | null } {
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

  let dueDate: Timestamp | null = null;
  if (lifespanDays != null) {
    const baseDate = serviceRecordDate.toDate();
    baseDate.setDate(baseDate.getDate() + lifespanDays);
    dueDate = Timestamp.fromDate(baseDate);
  }

  return {dueMileage, dueDate};
}

// HIGHLIGHT: use Firestore type instead of FirebaseFirestore.Firestore
async function preloadCatalogForItems(
  db: FirebaseFirestore.Firestore,
  items: ServiceItem[],
  companyId: string
): Promise<Map<string, ServiceItemPrime>> {
  const catalogByKey = new Map<string, ServiceItemPrime>();

  if (items.length === 0) return catalogByKey;

  const distinctNames = Array.from(
    new Set(items.map((item) => item.name.trim()))
  );
  const nameBatches = chunkArray(distinctNames, 10);

  for (const nameBatch of nameBatches) {
    const snapshot = await db
      .collection("service-items")
      .where("companyId", "==", companyId)
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
    const db = getFirestore(); // HIGHLIGHT: admin Firestore

    try {
      if (!event.data) {
        logger.warn("No data in service record create event", event.params);
        return;
      }

      const serviceRecordId = event.params.serviceRecordId;
      const serviceRecord = event.data.data() as ServiceRecord | undefined;

      if (!serviceRecord) {
        logger.warn("Service record document has no data", {
          serviceRecordId,
        });
        return;
      }

      // HIGHLIGHT: pull companyId from the service record
      const {vehicleId, date, serviceMileage, companyId} = serviceRecord;

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
          companyId: (data.companyId as string) ?? companyId,
          name: data.name,
          value: data.value,
          unit: data.unit,
          quantity: data.quantity,
          cost: data.cost,
          date: (data.date ?? date) as Timestamp, // HIGHLIGHT: cast to Timestamp
          vehicleMileage: data.vehicleMileage ?? serviceMileage,
          expectedLifespanMileage:
            data.expectedLifespanMileage ?? undefined,
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
        companyId,
        itemCount: itemsChanged.length,
      });

      const catalogByKey = await preloadCatalogForItems(
        db,
        itemsChanged,
        companyId
      );

      const trackerRef = db
        .collection("vehicleServiceTracker")
        .doc(vehicleId);

      const now = Timestamp.now();

      // HIGHLIGHT: SINGLE TRANSACTION UPDATING SUMMARY + FLATTENED ITEMS MAP + AGGREGATES
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(trackerRef);

        const existingDoc = snapshot.exists ?
          (snapshot.data() as VehicleServiceTrackerDoc) :
          null;

        const currentLastServiceDate =
          existingDoc?.lastServiceDate ?? null;
        const currentLastServiceMileage =
          existingDoc?.lastServiceMileage ?? null;
        const currentItems = existingDoc?.items ?? {};

        const newLastServiceDate =
          !currentLastServiceDate ||
            date.toMillis() > currentLastServiceDate.toMillis() ?
            date :
            currentLastServiceDate;

        const newLastServiceMileage =
          currentLastServiceMileage == null ||
            serviceMileage > currentLastServiceMileage ?
            serviceMileage :
            currentLastServiceMileage;

        const updatedItems: Record<string, VehicleServiceTrackerItemState> =
        {
          ...currentItems,
        };

        // HIGHLIGHT: recompute per-item due values and aggregate nextServiceDue*
        let nextServiceDueDate: Timestamp | null = null;
        let nextServiceDueMileage: number | null = null;

        for (const item of itemsChanged) {
          const itemKey = buildItemKey(item.kind, item.name);
          const catalog = catalogByKey.get(itemKey) ?? null;

          const {dueMileage, dueDate} = computeDueValues(
            date,
            serviceMileage,
            item,
            catalog
          );

          const existingItem =
            currentItems[itemKey] as
            | VehicleServiceTrackerItemState
            | undefined;

          const createdAt = existingItem?.createdAt ?? now;

          const itemState: VehicleServiceTrackerItemState = {
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

          updatedItems[itemKey] = itemState;

          // HIGHLIGHT: update aggregated earliest due date/mileage
          if (dueDate) {
            if (
              !nextServiceDueDate ||
              dueDate.toMillis() < nextServiceDueDate.toMillis()
            ) {
              nextServiceDueDate = dueDate;
            }
          }
          if (typeof dueMileage === "number") {
            if (
              nextServiceDueMileage == null ||
              dueMileage < nextServiceDueMileage
            ) {
              nextServiceDueMileage = dueMileage;
            }
          }
        }

        const newDoc: VehicleServiceTrackerDoc = {
          vehicleId,
          companyId,
          lastServiceDate: newLastServiceDate,
          lastServiceMileage: newLastServiceMileage,
          nextServiceDueDate:
            nextServiceDueDate ?? existingDoc?.nextServiceDueDate ?? null,
          nextServiceDueMileage:
            nextServiceDueMileage ?? existingDoc?.nextServiceDueMileage ?? null,
          lastIncomeLogAt: existingDoc?.lastIncomeLogAt ?? null,
          updatedAt: now,
          items: updatedItems,
          currentMileage: existingDoc?.currentMileage ?? null,
        };

        transaction.set(trackerRef, newDoc, {merge: true});
      });
      // HIGHLIGHT: END FLATTENED DOC UPDATE

      logger.info("Vehicle service tracker updated successfully", {
        vehicleId,
        companyId,
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

export const onVehicleCreated = onDocumentCreated(
  {document: "vehicles/{vehicleId}"},
  async (event) => {
    const db = getFirestore();
    if (!event.data) return;

    const vehicleId = event.params.vehicleId;
    const vehicleData = event.data.data() as {
      companyId: string;
      currentMileage?: number;
      registration?: string;
    };

    const {companyId, currentMileage = null} = vehicleData;
    if (!companyId) {
      logger.warn("Vehicle created without companyId", {vehicleId});
      return;
    }

    const trackerRef = db.collection("vehicleServiceTracker").doc(vehicleId);
    const companyRef = db.collection("companies").doc(companyId);

    await db.runTransaction(async (tx) => {
      // HIGHLIGHT: READ FIRST – get company before any writes
      const companySnap = await tx.get(companyRef);
      const currentCount = companySnap.exists ?
        ((companySnap.data()?.fleetSize as number) ?? 0) :
        0;

      // HIGHLIGHT: then perform all writes
      // initialise tracker doc
      tx.set(
        trackerRef,
        {
          vehicleId,
          companyId,
          lastServiceDate: null,
          lastServiceMileage: null,
          nextServiceDueDate: null,
          nextServiceDueMileage: null,
          lastIncomeLogAt: null,
          currentMileage,
          updatedAt: Timestamp.now(),
          items: {},
        },
        {merge: false}
      );

      // update company summary
      logger.info("Vehicle created successfully", {vehicleId, companyId});
      tx.set(
        companyRef,
        {
          fleetSize: currentCount + 1,
          updatedAt: Timestamp.now(),
        },
        {merge: true}
      );
    });
  }
);

// HIGHLIGHT: update lastIncomeLogAt per vehicle
export const onIncomeLogCreated = onDocumentCreated(
  {document: "income/{incomeLogId}"},
  async (event) => {
    const db = getFirestore();
    if (!event.data) return;

    const incomeLogId = event.params.incomeLogId;
    const data = event.data.data() as {
      companyId: string;
      vehicleId: string;
      date: FirebaseFirestore.Timestamp;
      closingMileage?: number;
    };

    const {companyId, vehicleId, date, closingMileage} = data;

    if (!companyId || !vehicleId || !date) {
      logger.warn("Income log missing required fields", {
        incomeLogId,
        companyId,
        vehicleId,
      });
      return;
    }

    const trackerRef = db.collection("vehicleServiceTracker").doc(vehicleId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(trackerRef);
      if (!snap.exists) {
        logger.warn("Tracker not found for income log", {
          vehicleId,
          incomeLogId,
        });
        return;
      }

      const tracker = snap.data() as VehicleServiceTrackerDoc;

      const currentLastIncome = tracker.lastIncomeLogAt;
      const shouldUpdate =
        !currentLastIncome ||
        date.toMillis() > currentLastIncome.toMillis();

      if (!shouldUpdate && closingMileage == null) return;

      const updatePayload: Partial<VehicleServiceTrackerDoc> = {
        updatedAt: Timestamp.now(),
      };

      if (shouldUpdate) {
        // HIGHLIGHT: update lastIncomeLogAt
        (updatePayload as any).lastIncomeLogAt = date;
      }

      if (typeof closingMileage === "number") {
        // optional: keep currentMileage in-sync
        (updatePayload as any).currentMileage = closingMileage;
      }

      tx.set(trackerRef, updatePayload, {merge: true});
    });
  }
);