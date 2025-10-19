// src/repos/status-sync.repo.ts
const { db } = require('../config/firebase');
import { Timestamp as FirestoreTimestamp } from 'firebase-admin/firestore';
import { Driver, Vehicle } from '../interfaces/interfaces';
const driversRef = db.collection('drivers');
const vehiclesCollection: FirebaseFirestore.CollectionReference = db.collection('vehicles');
const driversCollection: FirebaseFirestore.CollectionReference = db.collection('drivers');

/** Canonical status strings */
type DriverStatus = 'active' | 'inactive' | 'suspended';
type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'retired';

/** Normalize any incoming status to a safe lowercased union (fallback: undefined) */
function normDriverStatus(status?: string | null): DriverStatus | undefined {
  const normalisedStatus = (status ?? '').toLowerCase();
  if (normalisedStatus === 'active' || normalisedStatus === 'inactive' || normalisedStatus === 'suspended') return normalisedStatus;
  return undefined;
}
function normVehicleStatus(status?: string | null): VehicleStatus | undefined {
  const normalisedStatus = (status ?? '').toLowerCase();
  if (normalisedStatus === 'active' || normalisedStatus === 'inactive' || normalisedStatus === 'maintenance' || normalisedStatus === 'retired') return normalisedStatus;
  return undefined;
}

/**
 * Mapping policies (EDIT HERE to change behavior).
 *
 * Tip: Keep mappings idempotent to avoid ping-pong. If both controllers call their cascade,
 * it’s fine as long as we only write when the target value would actually change.
 */
const DRIVER_TO_VEHICLE: Record<DriverStatus, VehicleStatus> = {
  active: 'active',
  inactive: 'inactive',
  suspended: 'inactive', // you can pick 'maintenance' if you prefer
};

const VEHICLE_TO_DRIVER: Record<VehicleStatus, DriverStatus> = {
  active: 'active',
  inactive: 'inactive',
  maintenance: 'suspended', // or 'inactive' if that fits better
  retired: 'inactive',
};

/* ----------------------------------------------------------------------------
 * Shared helpers: clear assignments both ways (idempotent)
 * ------------------------------------------------------------------------- */

export async function clearVehicleDriverAssignment(vehicleId: string): Promise<void> {
  const vehicleRef = vehiclesCollection.doc(vehicleId);
  const vehicleSnapshot = await vehicleRef.get();
  if (!vehicleSnapshot.exists) return;

  const vehicle = vehicleSnapshot.data() as {
    assignedDriverId?: string | null;
    assignedDriver?: string | null;
  };

  const driverId: string | undefined =
    (vehicle as Vehicle).assignedDriverId || undefined;

  const batch = db.batch();

  // Vehicle: null assignment if not already null
  batch.update(vehicleRef, {
    assignedDriverId: null,
    updatedAt: FirestoreTimestamp.now(),
  });

  if (driverId) {
    const driverRef = driversCollection.doc(driverId);
    batch.update(driverRef, {
      assignedVehicleId: null,
      updatedAt: FirestoreTimestamp.now(),
    });
  }

  await batch.commit();
}

export async function clearDriverVehicleAssignment(driverId: string): Promise<void> {
  const driverRef = driversCollection.doc(driverId);
  const driverSnapshot = await driverRef.get();
  if (!driverSnapshot.exists) return;

  const driver = driverSnapshot.data() as {
    assignedVehicleId?: string | null;
    assignedVehicle?: string | null;
  };

  const vehicleId: string | undefined =
    (driver as Driver).assignedVehicleId || undefined;

  const batch = db.batch();

  
  batch.update(driverRef, {
    assignedVehicleId: null,
    updatedAt: FirestoreTimestamp.now(),
  });

  if (vehicleId) {
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    batch.update(vehicleRef, {
      assignedDriverId: null,
      updatedAt: FirestoreTimestamp.now(),
    });
  }

  await batch.commit();
}

/* ----------------------------------------------------------------------------
 * DRIVER → VEHICLE cascade
 *  - Map vehicle status from driver status.
 *  - If driver is not 'active', clear assignments both ways.
 * ------------------------------------------------------------------------- */
export async function cascadeVehicleStatusFromDriver(driverId: string): Promise<void> {
  const driverSnapshot = await driversCollection.doc(driverId).get();
  if (!driverSnapshot.exists) return;

  const driver = driverSnapshot.data() as { status?: string; assignedVehicleId?: string | null; assignedVehicle?: string | null };
  const driverStatus = normDriverStatus(driver.status);
  if (!driverStatus) return;

  const vehicleId = (driver.assignedVehicleId ?? driver.assignedVehicle ?? '').toString().trim();

  // If driver not active → clear assignments both ways (idempotent)
  if (driverStatus !== 'active' && vehicleId) {
    await clearDriverVehicleAssignment(driverId);
  }

  // If there is still a vehicle linked (some schemas keep both name & id; the clear above handles both),
  // map and update vehicle status if needed.
  if (!vehicleId) return;

  const mappedVehicleStatus = DRIVER_TO_VEHICLE[driverStatus];

  const vehicleRef = vehiclesCollection.doc(vehicleId);
  const vehicleSnapshot = await vehicleRef.get();
  if (!vehicleSnapshot.exists) return;

  const vehicle = vehicleSnapshot.data() as { status?: string | null };
  const current = normVehicleStatus(vehicle.status);

  // Update only if different
  if (current !== mappedVehicleStatus) {
    await vehicleRef.update({
      status: mappedVehicleStatus,
      updatedAt: FirestoreTimestamp.now(),
    });
  }
}

const getDocInTx = async (
  tx: FirebaseFirestore.Transaction,
  ref: FirebaseFirestore.DocumentReference
): Promise<FirebaseFirestore.DocumentSnapshot> => {
  // Admin SDK Transaction#get only returns DocumentSnapshot,
  // but we cast anyway to disambiguate if web types sneak in.
  return (tx.get(ref) as unknown) as Promise<FirebaseFirestore.DocumentSnapshot>;
};

export async function cascadeDriverStatusFromVehicle(vehicleId: string) {
  await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
    const vRef = vehiclesCollection.doc(vehicleId);
    const vSnap = await getDocInTx(tx, vRef);               // ✅ always a DocumentSnapshot
    if (!vSnap.exists) return;

    const v = vSnap.data() as Vehicle;
    const driverId = (v as any).assignedDriver as string | null;

    if (!driverId) return; // nothing to sync

    const dRef = driversRef.doc(driverId);
    const dSnap = await getDocInTx(tx, dRef);               // ✅ always a DocumentSnapshot
    if (!dSnap.exists) return;

    const d = dSnap.data() as Driver;
    const driverPatch: Partial<Driver> & { updatedAt: string } = {
      updatedAt: new Date().toISOString(),
      assignedVehicleId: vehicleId,
    };

    // Seed mileageOnStart if missing/zeroish
    const needsStartStamp =
      d.mileageOnStart === undefined ||
      d.mileageOnStart === null ||
      (typeof d.mileageOnStart === "number" && d.mileageOnStart <= 0);

    if (needsStartStamp) {
      driverPatch.mileageOnStart = (v as any).currentMileage ?? 0;
    }

    // Reflect vehicle status onto driver + mileageOnEnd
    if ((v as any).status === "inactive") {
      driverPatch.status = "inactive" as any; // tighten if you have VehicleStatus/Driver.status types
      if (d.mileageOnEnd === undefined || d.mileageOnEnd === null) {
        driverPatch.mileageOnEnd = (v as any).currentMileage ?? null;
      }
    } else {
      if (d.status !== "active") driverPatch.status = "active";
      driverPatch.mileageOnEnd = null;
    }

    tx.update(dRef, driverPatch);
  });
}


type AssignDriverResult =
  | { ok: true }
  | { ok: false; http: number; code: string; message: string };

export async function assignDriverToVehicleOnAdd(
  vehiclePlateId: string,
  driverId: string,
  mileageOnStart: number
): Promise<AssignDriverResult> {
  const now = new Date().toISOString();
  const driverRef = driversCollection.doc(driverId);

  try {
    await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
      const dSnap = await tx.get(driverRef);
      if (!dSnap.exists) {
        throw { http: 404, code: "DRIVER_NOT_FOUND", message: "Driver not found" };
      }

      const d = dSnap.data() as any;

  
      if (d?.assignedVehicleId && d.assignedVehicleId !== vehiclePlateId) {
        throw {
          http: 409,
          code: "DRIVER_ALREADY_ASSIGNED",
          message: `Driver is already assigned to vehicle "${d.assignedVehicleId}"`,
        };
      }

      tx.update(driverRef, {
        assignedVehicleId: vehiclePlateId,
        status: "active",
        mileageOnStart: Number(mileageOnStart || 0),
        updatedAt: now,
      });
    });

    return { ok: true };
  } catch (err: any) {
    if (err?.http && err?.code) {
      return { ok: false, http: err.http, code: err.code, message: err.message };
    }
    // Unexpected error
    return {
      ok: false,
      http: 500,
      code: "DRIVER_ASSIGNMENT_FAILED",
      message: err?.message ?? "Failed to assign driver",
    };
  }
}