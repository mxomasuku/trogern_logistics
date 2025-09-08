// src/repos/status-sync.repo.ts
const { db } = require('../config/firebase');
import { Timestamp as FirestoreTimestamp } from 'firebase-admin/firestore';
import { Driver, Vehicle } from '../interfaces/interfaces';

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
    (vehicle as Vehicle).assignedDriver || undefined;

  const batch = db.batch();

  // Vehicle: null assignment if not already null
  batch.update(vehicleRef, {
    assignedDriverId: null,
    assignedDriver: null,
    updatedAt: FirestoreTimestamp.now(),
  });

  if (driverId) {
    const driverRef = driversCollection.doc(driverId);
    batch.update(driverRef, {
      assignedVehicleId: null,
      assignedVehicle: null,
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
    assignedVehicle: null,
    updatedAt: FirestoreTimestamp.now(),
  });

  if (vehicleId) {
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    batch.update(vehicleRef, {
      assignedDriverId: null,
      assignedDriver: null,
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

/* ----------------------------------------------------------------------------
 * VEHICLE → DRIVER cascade
 *  - Map driver status from vehicle status.
 *  - If vehicle is not 'active', clear assignments both ways.
 * ------------------------------------------------------------------------- */
export async function cascadeDriverStatusFromVehicle(vehicleId: string): Promise<void> {
  const vSnap = await vehiclesCollection.doc(vehicleId).get();
  if (!vSnap.exists) return;

  const v = vSnap.data() as {
    status?: string | null;
    assignedDriverId?: string | null;
    assignedDriver?: string | null; // if you stored name instead of id, adapt lookup
  };
  const vehicleStatus = normVehicleStatus(v.status);
  if (!vehicleStatus) return;

  // Prefer an ID field; fall back to name only if that’s your current schema
  const driverId: string | undefined =
    (v as any).assignedDriverId || (v as any).assignedDriver || undefined;

  // If vehicle is not active → clear assignments both ways (idempotent)
  if (vehicleStatus !== 'active' && driverId) {
    await clearVehicleDriverAssignment(vehicleId);
  }

  // If we still have a driver (e.g., someone changed status before clearing), map & update driver status.
  if (!driverId) return;

  const mappedDriverStatus = VEHICLE_TO_DRIVER[vehicleStatus];

  const dRef = driversCollection.doc(driverId);
  const dSnap = await dRef.get();
  if (!dSnap.exists) return;

  const d = dSnap.data() as { status?: string | null };
  const current = normDriverStatus(d.status);

  if (current !== mappedDriverStatus) {
    await dRef.update({
      status: mappedDriverStatus,
      updatedAt: FirestoreTimestamp.now(),
    });
  }
}