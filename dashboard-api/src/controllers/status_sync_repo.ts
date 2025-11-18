// src/repos/status-sync.repo.ts
const { db } = require("../config/firebase");
import { Timestamp as FirestoreTimestamp } from "firebase-admin/firestore";
import { Driver, Vehicle } from "../interfaces/interfaces";

const driversRef = db.collection("drivers");
const vehiclesCollection: FirebaseFirestore.CollectionReference =
  db.collection("vehicles");
const driversCollection: FirebaseFirestore.CollectionReference =
  db.collection("drivers");

/** Canonical status strings */
type DriverStatus = "active" | "inactive" | "suspended";
type VehicleStatus = "active" | "inactive" | "maintenance" | "retired";

/** Normalize any incoming status to a safe lowercased union (fallback: undefined) */
function normDriverStatus(status?: string | null): DriverStatus | undefined {
  const normalisedStatus = (status ?? "").toLowerCase();
  if (
    normalisedStatus === "active" ||
    normalisedStatus === "inactive" ||
    normalisedStatus === "suspended"
  )
    return normalisedStatus;
  return undefined;
}
function normVehicleStatus(status?: string | null): VehicleStatus | undefined {
  const normalisedStatus = (status ?? "").toLowerCase();
  if (
    normalisedStatus === "active" ||
    normalisedStatus === "inactive" ||
    normalisedStatus === "maintenance" ||
    normalisedStatus === "retired"
  )
    return normalisedStatus;
  return undefined;
}

/**
 * Mapping policies (EDIT HERE to change behavior).
 *
 * Tip: Keep mappings idempotent to avoid ping-pong. If both controllers call their cascade,
 * it’s fine as long as we only write when the target value would actually change.
 */
const DRIVER_TO_VEHICLE: Record<DriverStatus, VehicleStatus> = {
  active: "active",
  inactive: "inactive",
  suspended: "inactive", // you can pick 'maintenance' if you prefer
};

const VEHICLE_TO_DRIVER: Record<VehicleStatus, DriverStatus> = {
  active: "active",
  inactive: "inactive",
  maintenance: "suspended", // or 'inactive' if that fits better
  retired: "inactive",
};

/* ----------------------------------------------------------------------------
 * Shared helpers: clear assignments both ways (idempotent)
 * ------------------------------------------------------------------------- */

export async function clearVehicleDriverAssignment(
  vehicleId: string
): Promise<void> {
  const vehicleRef = vehiclesCollection.doc(vehicleId);
  const vehicleSnapshot = await vehicleRef.get();
  if (!vehicleSnapshot.exists) return;

  const vehicle = vehicleSnapshot.data() as Vehicle & {
    companyId?: string;
    assignedDriverId?: string | null;
    assignedDriver?: string | null;
  };

  // HIGHLIGHT: capture company scope from vehicle
  const vehicleCompanyId = (vehicle as any).companyId ?? null;
  const driverId: string | undefined =
    (vehicle as any).assignedDriverId || undefined;

  const batch = db.batch();

  // Vehicle: null assignment if not already null
  batch.update(vehicleRef, {
    assignedDriverId: null,
    updatedAt: FirestoreTimestamp.now(),
  });

  if (driverId) {
    const driverRef = driversCollection.doc(driverId);
    const driverSnapshot = await driverRef.get();

    if (driverSnapshot.exists) {
      const driver = driverSnapshot.data() as Driver & { companyId?: string };

      // HIGHLIGHT: only clear driver link if same company
      if ((driver as any).companyId === vehicleCompanyId) {
        batch.update(driverRef, {
          assignedVehicleId: null,
          updatedAt: FirestoreTimestamp.now(),
        });
      }
    }
  }

  await batch.commit();
}

export async function clearDriverVehicleAssignment(
  driverId: string
): Promise<void> {
  const driverRef = driversCollection.doc(driverId);
  const driverSnapshot = await driverRef.get();
  if (!driverSnapshot.exists) return;

  const driver = driverSnapshot.data() as Driver & {
    companyId?: string;
    assignedVehicleId?: string | null;
    assignedVehicle?: string | null;
  };

  // HIGHLIGHT: capture company scope from driver
  const driverCompanyId = (driver as any).companyId ?? null;
  const vehicleId: string | undefined =
    (driver as any).assignedVehicleId || undefined;

  const batch = db.batch();

  batch.update(driverRef, {
    assignedVehicleId: null,
    updatedAt: FirestoreTimestamp.now(),
  });

  if (vehicleId) {
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const vehicleSnapshot = await vehicleRef.get();

    if (vehicleSnapshot.exists) {
      const vehicle = vehicleSnapshot.data() as Vehicle & { companyId?: string };

      // HIGHLIGHT: only clear vehicle link if same company
      if ((vehicle as any).companyId === driverCompanyId) {
        batch.update(vehicleRef, {
          assignedDriverId: null,
          updatedAt: FirestoreTimestamp.now(),
        });
      }
    }
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

  const driver = driverSnapshot.data() as Driver & { companyId?: string };

  const driverStatus = normDriverStatus(driver.status);
  if (!driverStatus) return;

  // HIGHLIGHT: company scope from driver
  const driverCompanyId = (driver as any).companyId ?? null;

  // normalise previous and new vehicle ids
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
    nextId,
    "companyId:",
    driverCompanyId
  );

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

      const vehicle = snap.data() as Vehicle & { companyId?: string };

      // HIGHLIGHT: only touch vehicles in the same company
      if ((vehicle as any).companyId !== driverCompanyId) {
        console.log(
          "[updateVehicleStatusFromDriver] skip vehicle",
          vid,
          "company mismatch"
        );
        continue;
      }

      const patch: any = {
        assignedDriverId: "",
        assignedDriverName: "",
        updatedAt: FirestoreTimestamp.now(),
      };

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

  // 2a) detach from previous vehicle if different
  if (prevId && prevId !== nextId) {
    const prevRef = vehiclesCollection.doc(prevId);
    const prevSnap = await prevRef.get();
    if (prevSnap.exists) {
      const prevVehicle = prevSnap.data() as Vehicle & { companyId?: string };

      // HIGHLIGHT: enforce same-company
      if ((prevVehicle as any).companyId === driverCompanyId) {
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
          "[updateVehicleStatusFromDriver] skip detaching from previous vehicle",
          prevId,
          "company mismatch"
        );
      }
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

  const vehicle = vehicleSnapshot.data() as Vehicle & { companyId?: string };
  const currentVehicleStatus = normVehicleStatus(vehicle.status);

  // HIGHLIGHT: enforce same-company
  if ((vehicle as any).companyId !== driverCompanyId) {
    console.log(
      "[updateVehicleStatusFromDriver] skip attaching vehicle",
      nextId,
      "company mismatch"
    );
    return;
  }

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
  return tx.get(ref) as unknown as Promise<FirebaseFirestore.DocumentSnapshot>;
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
      console.log(
        "[updateDriverStatusFromVehicle] vehicle not found",
        vehicleId
      );
      return;
    }

    const vehicle = vehicleSnapshot.data() as Vehicle & { companyId?: string };
    const vehicleStatus = (vehicle as any).status;

    // HIGHLIGHT: company scope from vehicle
    const vehicleCompanyId = (vehicle as any).companyId ?? null;

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
      nextId,
      "companyId:",
      vehicleCompanyId
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

      const driver = driverSnapshot.data() as Driver & { companyId?: string };

      // HIGHLIGHT: enforce same-company
      if ((driver as any).companyId !== vehicleCompanyId) {
        console.log(
          "[updateDriverStatusFromVehicle] skip inactivating driver",
          prevId,
          "company mismatch"
        );
        return;
      }

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
        const prevDriver = prevSnap.data() as Driver & { companyId?: string };

        // HIGHLIGHT: enforce same-company
        if ((prevDriver as any).companyId === vehicleCompanyId) {
          const prevPatch: Partial<Driver> & { updatedAt: string } = {
            updatedAt: new Date().toISOString(),
            assignedVehicleId: "",
          };

          if (
            prevDriver.mileageOnEnd === undefined ||
            prevDriver.mileageOnEnd === null
          ) {
            prevPatch.mileageOnEnd =
              (vehicle as any).currentMileage ?? null;
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
            "[updateDriverStatusFromVehicle] skip detaching previous driver",
            prevId,
            "company mismatch"
          );
        }
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

    const newDriver = newSnap.data() as Driver & { companyId?: string };

    // HIGHLIGHT: enforce same-company
    if ((newDriver as any).companyId !== vehicleCompanyId) {
      console.log(
        "[updateDriverStatusFromVehicle] skip attaching new driver",
        nextId,
        "company mismatch"
      );
      return;
    }

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
  const vehicleRef = vehiclesCollection.doc(vehiclePlateId); // HIGHLIGHT

  try {
    await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
      // HIGHLIGHT: read vehicle inside tx for companyId
      const vSnap = await tx.get(vehicleRef);
      if (!vSnap.exists) {
        throw {
          http: 404,
          code: "VEHICLE_NOT_FOUND",
          message: "Vehicle not found",
        };
      }
      const vehicle = vSnap.data() as Vehicle & { companyId?: string };
      const vehicleCompanyId = (vehicle as any).companyId ?? null;

      const dSnap = await tx.get(driverRef);
      if (!dSnap.exists) {
        throw {
          http: 404,
          code: "DRIVER_NOT_FOUND",
          message: "Driver not found",
        };
      }

      const d = dSnap.data() as Driver & { companyId?: string };

      // HIGHLIGHT: enforce same-company or set driver.companyId if missing
      const driverCompanyId = (d as any).companyId ?? null;

      if (driverCompanyId && vehicleCompanyId && driverCompanyId !== vehicleCompanyId) {
        throw {
          http: 409,
          code: "COMPANY_MISMATCH",
          message: "Driver belongs to a different company than vehicle",
        };
      }

      if (d?.assignedVehicleId && d.assignedVehicleId !== vehiclePlateId) {
        throw {
          http: 409,
          code: "DRIVER_ALREADY_ASSIGNED",
          message: `Driver is already assigned to vehicle "${d.assignedVehicleId}"`,
        };
      }

      const patch: any = {
        assignedVehicleId: vehiclePlateId,
        status: "active",
        mileageOnStart: Number(mileageOnStart || 0),
        updatedAt: now,
      };

      // HIGHLIGHT: if driver has no companyId yet but vehicle does, set it
      if (!driverCompanyId && vehicleCompanyId) {
        patch.companyId = vehicleCompanyId;
      }

      tx.update(driverRef, patch);
    });

    return { ok: true };
  } catch (err: any) {
    if (err?.http && err?.code) {
      return { ok: false, http: err.http, code: err.code, message: err.message };
    }
    return {
      ok: false,
      http: 500,
      code: "DRIVER_ASSIGNMENT_FAILED",
      message: err?.message ?? "Failed to assign driver",
    };
  }
}