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

// EDITED SIGNATURE
export async function updateVehicleStatusFromDriver(
  driverId: string,
  previousVehicleId?: string | null
): Promise<void> {
  // Load the UPDATED driver (after patch)
  const driverSnapshot = await driversCollection.doc(driverId).get();
  if (!driverSnapshot.exists) return;

  const driver = driverSnapshot.data() as Driver;

  const driverStatus = normDriverStatus(driver.status);
  if (!driverStatus) return;

  // EDITED: normalise previous and new vehicle ids
  const prevId =
    typeof previousVehicleId === "string" && previousVehicleId.trim()
      ? previousVehicleId.trim()
      : null;

  const newVehicleIdRaw = (driver.assignedVehicleId ?? "").toString();
  const nextId = newVehicleIdRaw.trim() || null;

  const mappedVehicleStatus = DRIVER_TO_VEHICLE[driverStatus] ?? null;

  console.log(
    "[updateVehicleStatusFromDriver] driver",
    driverId,
    "status:",
    driverStatus,
    "previousVehicleId:",
    prevId,
    "newVehicleId:",
    nextId
  );
  // EDITED END

  // -------- Case 1: driver is NOT active → clear assignments on any linked vehicles --------
  if (driverStatus !== "active") {
    const vehicleIds = Array.from(
      new Set(
        [prevId, nextId].filter(
          (v): v is string => typeof v === "string" && v.length > 0
        )
      )
    );

    if (!vehicleIds.length) return;

    for (const vid of vehicleIds) {
      const vehicleRef = vehiclesCollection.doc(vid);
      const snap = await vehicleRef.get();
      if (!snap.exists) continue;

      const patch: any = {
        assignedDriverId: "",
        assignedDriverName: "",
        updatedAt: FirestoreTimestamp.now(),
      };

      // If you want vehicle status to reflect driver's non-active state
      if (mappedVehicleStatus) {
        patch.status = mappedVehicleStatus;
      }

      console.log(
        "[updateVehicleStatusFromDriver] clearing vehicle assignment for",
        vid,
        "patch:",
        patch
      );

      await vehicleRef.update(patch);
    }

    return;
  }

  // -------- Case 2: driver is ACTIVE --------

  // 2a) If they had a previous vehicle and changed vehicles, detach from previous
  if (prevId && prevId !== nextId) {
    const prevRef = vehiclesCollection.doc(prevId);
    const prevSnap = await prevRef.get();
    if (prevSnap.exists) {
      const prevPatch: any = {
        assignedDriverId: "",
        assignedDriverName: "",
        updatedAt: FirestoreTimestamp.now(),
      };

      console.log(
        "[updateVehicleStatusFromDriver] detaching driver from previous vehicle",
        prevId,
        "patch:",
        prevPatch
      );

      await prevRef.update(prevPatch);
    } else {
      console.log(
        "[updateVehicleStatusFromDriver] previous vehicle not found when detaching",
        prevId
      );
    }
  }

  // 2b) If there is no current vehicle, nothing more to do
  if (!nextId) {
    console.log(
      "[updateVehicleStatusFromDriver] active driver but no assigned vehicle, done"
    );
    return;
  }

  // 2c) Attach / sync current vehicle
  const vehicleRef = vehiclesCollection.doc(nextId);
  const vehicleSnapshot = await vehicleRef.get();
  if (!vehicleSnapshot.exists) {
    console.log(
      "[updateVehicleStatusFromDriver] current vehicle not found for id",
      nextId
    );
    return;
  }

  const vehicle = vehicleSnapshot.data() as { status?: string | null };
  const currentVehicleStatus = normVehicleStatus(vehicle.status);

  const vehiclePatch: any = {
    assignedDriverId: driverId,
    assignedDriverName: driver.name,
    updatedAt: FirestoreTimestamp.now(),
  };

  if (mappedVehicleStatus && currentVehicleStatus !== mappedVehicleStatus) {
    vehiclePatch.status = mappedVehicleStatus;
  }

  console.log(
    "[updateVehicleStatusFromDriver] updating current vehicle",
    nextId,
    "patch:",
    vehiclePatch
  );

  await vehicleRef.update(vehiclePatch);
}
const getDocInFirebaseTransaction = async (
  tx: FirebaseFirestore.Transaction,
  ref: FirebaseFirestore.DocumentReference
): Promise<FirebaseFirestore.DocumentSnapshot> => {
  // Admin SDK Transaction#get only returns DocumentSnapshot,
  // but we cast anyway to disambiguate if web types sneak in.
  return (tx.get(ref) as unknown) as Promise<FirebaseFirestore.DocumentSnapshot>;
};

export async function updateDriverStatusFromVehicle(
  vehicleId: string,
  previousDriverId?: string | null,
  newDriverId?: string | null
): Promise<void> {
  await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const vehicleSnapshot = await getDocInFirebaseTransaction(tx, vehicleRef);

    if (!vehicleSnapshot.exists) {
      console.log("[updateDriverStatusFromVehicle] vehicle not found", vehicleId);
      return;
    }

    const vehicle = vehicleSnapshot.data() as Vehicle;
    const vehicleStatus = (vehicle as any).status;

    const prevId =
      typeof previousDriverId === "string" && previousDriverId.trim()
        ? previousDriverId.trim()
        : null;
    const nextId =
      typeof newDriverId === "string" && newDriverId.trim()
        ? newDriverId.trim()
        : null;

    console.log(
      "[updateDriverStatusFromVehicle] vehicle",
      vehicleId,
      "status:",
      vehicleStatus,
      "previousDriverId:",
      prevId,
      "newDriverId:",
      nextId
    );

    // 1) Vehicle is INACTIVE → mark previous driver inactive + clear vehicle
    if (vehicleStatus === "inactive") {
      if (!prevId) {
        console.log(
          "[updateDriverStatusFromVehicle] inactive vehicle but no previous driver, nothing to do"
        );
        return;
      }

      const driverRef = driversRef.doc(prevId);
      const driverSnapshot = await getDocInFirebaseTransaction(tx, driverRef);
      if (!driverSnapshot.exists) {
        console.log(
          "[updateDriverStatusFromVehicle] previous driver not found for id",
          prevId
        );
        return;
      }

      const driver = driverSnapshot.data() as Driver;

      const driverPatch: Partial<Driver> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(),
        status: "inactive" as any,
        assignedVehicleId: "",
      };

      if (
        driver.mileageOnEnd === undefined ||
        driver.mileageOnEnd === null
      ) {
        driverPatch.mileageOnEnd = (vehicle as any).currentMileage ?? null;
      }

      const needsStartStamp =
        driver.mileageOnStart === undefined ||
        driver.mileageOnStart === null ||
        (typeof driver.mileageOnStart === "number" &&
          driver.mileageOnStart <= 0);

      if (needsStartStamp) {
        driverPatch.mileageOnStart = (vehicle as any).currentMileage ?? 0;
      }

      console.log(
        "[updateDriverStatusFromVehicle] marking previous driver inactive",
        prevId,
        "patch:",
        driverPatch
      );

      tx.update(driverRef, driverPatch);
      return;
    }

    // 2) Vehicle is ACTIVE (or anything else) → attach / reassign
    // 2a) If previous driver exists and is different from new, detach old one
    if (prevId && prevId !== nextId) {
      const prevRef = driversRef.doc(prevId);
      const prevSnap = await getDocInFirebaseTransaction(tx, prevRef);
      if (prevSnap.exists) {
        const prevDriver = prevSnap.data() as Driver;
        const prevPatch: Partial<Driver> & { updatedAt: string } = {
          updatedAt: new Date().toISOString(),
          assignedVehicleId: "",
        };

        if (
          prevDriver.mileageOnEnd === undefined ||
          prevDriver.mileageOnEnd === null
        ) {
          prevPatch.mileageOnEnd = (vehicle as any).currentMileage ?? null;
        }

        console.log(
          "[updateDriverStatusFromVehicle] detaching previous driver",
          prevId,
          "patch:",
          prevPatch
        );

        tx.update(prevRef, prevPatch);
      } else {
        console.log(
          "[updateDriverStatusFromVehicle] previous driver not found when detaching",
          prevId
        );
      }
    }

    // 2b) Attach / update new driver
    if (!nextId) {
      console.log(
        "[updateDriverStatusFromVehicle] active vehicle but no new driver, nothing to attach"
      );
      return;
    }

    const newRef = driversRef.doc(nextId);
    const newSnap = await getDocInFirebaseTransaction(tx, newRef);
    if (!newSnap.exists) {
      console.log(
        "[updateDriverStatusFromVehicle] new driver not found for id",
        nextId
      );
      return;
    }

    const newDriver = newSnap.data() as Driver;

    const newPatch: Partial<Driver> & { updatedAt: string } = {
      updatedAt: new Date().toISOString(),
      assignedVehicleId: vehicleId,
    };

    if (newDriver.status !== "active") {
      newPatch.status = "active" as any;
    }

    const newNeedsStartStamp =
      newDriver.mileageOnStart === undefined ||
      newDriver.mileageOnStart === null ||
      (typeof newDriver.mileageOnStart === "number" &&
        newDriver.mileageOnStart <= 0);

    if (newNeedsStartStamp) {
      newPatch.mileageOnStart = (vehicle as any).currentMileage ?? 0;
    }

    newPatch.mileageOnEnd = null;

    console.log(
      "[updateDriverStatusFromVehicle] attaching/updating new driver",
      nextId,
      "patch:",
      newPatch
    );

    tx.update(newRef, newPatch);
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