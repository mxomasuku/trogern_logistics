// src/controllers/driver.controller.ts
import { Request, Response } from "express";
const { db, admin } = require("../config/firebase");
import type {
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { success, failure } from "../utils/apiResponse";
import { Driver, Vehicle } from "../types/index";
import { updateVehicleStatusFromDriver } from "./status_sync_repo";
import { logInfo } from "../utils/logger";

// HIGHLIGHT: company context helper
import { requireCompanyContext } from "../utils/companyContext";

const driversRef = db.collection("drivers");
const nowTs = () => admin.firestore.Timestamp.now();
const vehiclesCollection = db.collection("vehicles");

// ===============================================
// GET ALL DRIVERS (scoped to company)
// ===============================================
export const getAllDrivers = async (req: Request, res: Response) => {
  // HIGHLIGHT: require company context
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    // HIGHLIGHT: scope by companyId
    const snapshot = await driversRef
      .where("companyId", "==", companyId)
      .get();

    const drivers = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(success(drivers));
  } catch (error: any) {
    console.error("Error fetching drivers:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch drivers",
          error.message
        )
      );
  }
};

// ===============================================
// GET DRIVER BY ID (scoped to company)
// ===============================================
export const getDriverById = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res); // HIGHLIGHT
  if (!ctx) return;
  const { companyId } = ctx;
  const { id } = req.params;

  try {
    const doc = await driversRef.doc(id).get();
    if (!doc.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Driver not found", { id }));
    }

    const data = doc.data() as Driver & { companyId?: string };

    // HIGHLIGHT: make sure this driver belongs to current company
    if (!data.companyId || data.companyId !== companyId) {
      return res
        .status(404)
        .json(
          failure(
            "NOT_FOUND",
            "Driver not found in this company",
            { id }
          )
        );
    }

    const payload = { id: doc.id, ...data };
    return res.status(200).json(success(payload));
  } catch (error: any) {
    console.error("Error fetching driver by id:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch driver",
          error.message
        )
      );
  }
};

// ===============================================
// ADD DRIVER (scoped to company)
// ===============================================
export const addDriver = async (
  req: Request<{}, {}, Driver>,
  res: Response
) => {
  // HIGHLIGHT: get company context
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const {
    name,
    contact,
    address,
    licenseNumber,
    nationalId,
    assignedVehicleId,
    status,
    dob,
    gender,
    experienceYears,
    nextOfKin,
    emergencyContact,
    email,
    mileageOnStart = null,
    mileageOnEnd = null,
  } = req.body;

  const cleanLicenseNumber = licenseNumber?.replace(/\s+/g, "") || "";

  const missingFields: string[] = [];
  if (!name) missingFields.push("name");
  if (!contact) missingFields.push("contact");
  if (!cleanLicenseNumber) missingFields.push("licenseNumber");
  if (!nationalId) missingFields.push("nationalId");
  if (!dob) missingFields.push("dob");
  if (!gender) missingFields.push("gender");
  if (!nextOfKin?.name) missingFields.push("nextOfKin.name");
  if (!nextOfKin?.phone) missingFields.push("nextOfKin.phone");
  if (!emergencyContact) missingFields.push("emergencyContact");
  if (missingFields.length > 0) {
    return res
      .status(400)
      .json(
        failure("VALIDATION_ERROR", "Missing required fields", {
          missingFields,
        })
      );
  }

  try {
    const now = new Date().toISOString();

    // HIGHLIGHT: attach companyId to driver
    const driverData: Driver & { companyId: string; isActive: boolean } = {
      name,
      mileageOnStart,
      mileageOnEnd,
      licenseNumber: cleanLicenseNumber,
      nationalId,
      contact,
      email,
      address,
      dob,
      gender,
      status,
      experienceYears,
      assignedVehicleId,
      nextOfKin,
      emergencyContact,
      isActive: status == "active" ? true : false,
      companyId, // HIGHLIGHT
    };

    const docRef = driversRef.doc(cleanLicenseNumber);

    const existing = await docRef.get();
    if (existing.exists) {
      return res
        .status(409)
        .json(
          failure(
            "DUPLICATE_LICENSE",
            `Driver with license number "${cleanLicenseNumber}" already exists`
          )
        );
    }

    await docRef.set({
      ...driverData,
      createdAt: now,
      updatedAt: now,
    });

    // HIGHLIGHT: reconcile still works, driver doc now has companyId inside
    await reconcileDriverVehicleAssignment(cleanLicenseNumber);

    // HIGHLIGHT: Log driver added
    void logInfo("driver_added", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "POST",
      driverId: cleanLicenseNumber,
      driverName: name,
      tags: ["driver", "create"],
      message: `${ctx.email} added driver ${name} (${cleanLicenseNumber})`,
    });

    return res
      .status(201)
      .json(
        success({
          id: cleanLicenseNumber,
          ...driverData,
          createdAt: now,
          updatedAt: now,
        })
      );
  } catch (error: any) {
    console.error("Error adding driver:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to add driver",
          error.message
        )
      );
  }
};

// ===============================================
// UPDATE DRIVER (scoped to company)
// ===============================================
export const updateDriver = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res); // HIGHLIGHT
  if (!ctx) return;
  const { companyId } = ctx;

  const id = req.params.id as string;
  const patch = { ...req.body, updatedAt: new Date().toISOString() };

  try {
    const driverRef = driversRef.doc(id);
    const existingSnap = await driverRef.get();

    if (!existingSnap.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Driver not found", { id }));
    }

    const existingDriver = existingSnap.data() as Driver & {
      companyId?: string;
    };

    // HIGHLIGHT: enforce same company
    if (!existingDriver.companyId || existingDriver.companyId !== companyId) {
      return res
        .status(404)
        .json(
          failure(
            "NOT_FOUND",
            "Driver not found in this company",
            { id }
          )
        );
    }

    const previousVehicleIdRaw =
      (existingDriver as any).assignedVehicleId ??
      (existingDriver as any).assignedVehicle ??
      null;

    const previousVehicleId =
      typeof previousVehicleIdRaw === "string" && previousVehicleIdRaw.trim()
        ? previousVehicleIdRaw.trim()
        : null;

    await driverRef.set(patch, { merge: true });

    await updateVehicleStatusFromDriver(id, previousVehicleId);

    // HIGHLIGHT: Log driver updated
    void logInfo("driver_updated", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "PUT",
      driverId: id,
      tags: ["driver", "update"],
      message: `${ctx.email} updated driver ${id}`,
    });

    return res.status(200).json(success({ id, ...patch }));
  } catch (error: any) {
    console.error("Error updating driver:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to update driver",
          error.message
        )
      );
  }
};

// ===============================================
// DELETE DRIVER (scoped to company)
// ===============================================
export const deleteDriver = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res); // HIGHLIGHT
  if (!ctx) return;
  const { companyId } = ctx;

  const { id } = req.params;

  try {
    await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
      const dRef = driversRef.doc(id);
      const dSnap = await getDocInTx(tx, dRef);
      if (!dSnap.exists) return;

      const d = dSnap.data() as Driver & { companyId?: string };

      // HIGHLIGHT: forbid deleting drivers of another company
      if (!d.companyId || d.companyId !== companyId) {
        return;
      }

      let vehicleToDetach: FirebaseFirestore.DocumentReference | null = null;

      if ((d as any).assignedVehicleId) {
        vehicleToDetach = vehiclesCollection.doc(
          (d as any).assignedVehicleId
        );
      } else {
        const qSnap = await vehiclesCollection
          .where("assignedDriver", "==", id)
          .get();
        if (!qSnap.empty) {
          vehicleToDetach = qSnap.docs[0].ref;
        }
      }

      if (vehicleToDetach) {
        const vSnap = await getDocInTx(tx, vehicleToDetach);
        if (vSnap.exists) {
          const v = vSnap.data() as Vehicle;

          tx.update(dRef, {
            mileageOnEnd:
              (d as any).mileageOnEnd === undefined ||
                (d as any).mileageOnEnd === null
                ? (v as any).currentMileage ?? null
                : (d as any).mileageOnEnd,
            updatedAt: new Date().toISOString(),
          });

          tx.update(vehicleToDetach, {
            assignedDriver: null,
            status: "inactive" as any,
            updatedAt: nowTs(),
          });
        }
      }

      tx.delete(dRef);
    });

    // HIGHLIGHT: Log driver deleted
    void logInfo("driver_deleted", {
      uid: ctx.uid,
      email: ctx.email,
      companyId,
      path: req.path,
      method: "DELETE",
      driverId: id,
      tags: ["driver", "delete"],
      message: `${ctx.email} deleted driver ${id}`,
    });

    return res.status(200).json(success({ id }));
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to delete driver",
          error.message
        )
      );
  }
};

// ===============================================
// SEARCH DRIVERS (scoped to company)
// ===============================================
export const searchDrivers = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res); // HIGHLIGHT
  if (!ctx) return;
  const { companyId } = ctx;

  const { name } = req.params;

  if (!name || typeof name !== "string") {
    return res
      .status(400)
      .json(
        failure(
          "MISSING_PARAM",
          "Path parameter 'name' is required"
        )
      );
  }

  try {
    const searchTerm = name.trim().toLowerCase();

    // HIGHLIGHT: scope by companyId AND order by nameLower
    const snapshot = await driversRef
      .where("companyId", "==", companyId)
      .orderBy("nameLower")
      .startAt(searchTerm)
      .endAt(searchTerm + "\uf8ff")
      .get();

    const drivers = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(success(drivers));
  } catch (error: any) {
    console.error("Error searching drivers:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to search drivers",
          error.message
        )
      );
  }
};

// ===============================================
// ACTIVE DRIVERS (scoped to company)
// ===============================================
export const getAllActiveDrivers = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res); // HIGHLIGHT
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const snapshot = await driversRef
      .where("companyId", "==", companyId) // HIGHLIGHT
      .where("status", "==", "active")
      .get();

    const drivers = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(success(drivers));
  } catch (error: any) {
    console.error("Error fetching active drivers:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch active drivers",
          error.message
        )
      );
  }
};

// ===============================================
// INACTIVE DRIVERS (scoped to company)
// ===============================================
export const getAllInactiveDrivers = async (req: Request, res: Response) => {
  const ctx = await requireCompanyContext(req, res); // HIGHLIGHT
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const snapshot = await driversRef
      .where("companyId", "==", companyId) // HIGHLIGHT
      .where("status", "not-in", ["active"])
      .get();

    const drivers = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(success(drivers));
  } catch (error: any) {
    console.error("Error fetching active drivers:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch active drivers",
          error.message
        )
      );
  }
};

const getDocInTx = async (
  tx: FirebaseFirestore.Transaction,
  ref: FirebaseFirestore.DocumentReference
): Promise<FirebaseFirestore.DocumentSnapshot> => {
  return (tx.get(ref) as unknown) as Promise<FirebaseFirestore.DocumentSnapshot>;
};

// ===============================================
// BELOW: sync helpers – still okay to be global,
// they rely on driver/vehicle docs already carrying companyId
// ===============================================

export async function reconcileDriverVehicleAssignment(
  driverId: string
) {
  const driverPre = await driversRef.doc(driverId).get();
  if (!driverPre.exists) return;

  const driver = driverPre.data() as Driver;

  const newVehicleId = (driver as any).assignedVehicleId || null;
  const isDriverActive =
    ((driver as any).status === "active" ||
      (driver as any).isActive === true) && !!newVehicleId;

  const oldVehicleQuerySnapshot = await vehiclesCollection
    .where("assignedDriverId", "==", driverId)
    .get();

  await db.runTransaction(
    async (tx: FirebaseFirestore.Transaction) => {
      const driverRef = driversRef.doc(driverId);
      const driverSnapshot = await getDocInTx(tx, driverRef);
      if (!driverSnapshot.exists) return;
      const driver = driverSnapshot.data() as Driver;

      let vehicleRef:
        | FirebaseFirestore.DocumentReference
        | null = null;
      let vehicleSnapshot:
        | FirebaseFirestore.DocumentSnapshot
        | null = null;

      if (newVehicleId) {
        const ref = vehiclesCollection.doc(newVehicleId);
        const snap = await getDocInTx(tx, ref);

        if (!snap.exists) {
          tx.update(driverRef, {
            assignedVehicleId: null,
            updatedAt: new Date().toISOString(),
          });
          return;
        }

        vehicleRef = ref;
        vehicleSnapshot = snap;
      }

      for (const doc of oldVehicleQuerySnapshot.docs) {
        if (!newVehicleId || doc.id !== newVehicleId) {
          tx.update(doc.ref, {
            assignedDriverId: null,
            updatedAt: nowTs(),
          });
        }
      }

      if (isDriverActive && vehicleRef && vehicleSnapshot) {
        const v = vehicleSnapshot.data() as Vehicle;

        const vehiclePatch: Partial<Vehicle> & {
          updatedAt: FirebaseFirestore.Timestamp;
        } = {
          assignedDriverId: driverId,
          updatedAt: nowTs(),
        };
        if ((v as any).status === "inactive") {
          (vehiclePatch as any).status = "active";
        }
        tx.update(vehicleRef, vehiclePatch);

        const needsStartStamp =
          (driver as any).mileageOnStart === undefined ||
          (driver as any).mileageOnStart === null ||
          (typeof (driver as any).mileageOnStart === "number" &&
            (driver as any).mileageOnStart <= 0);

        const driverPatch: Partial<Driver> & {
          updatedAt: string;
        } = {
          assignedVehicleId: vehicleRef.id,
          mileageOnEnd: null,
          updatedAt: new Date().toISOString(),
        };
        if (needsStartStamp) {
          (driverPatch as any).mileageOnStart =
            (v as any).currentMileage ?? 0;
        }

        tx.update(driverRef, driverPatch);
        return;
      }

      let currentVehicleForEnd:
        | FirebaseFirestore.DocumentReference
        | null = null;

      if (vehicleRef && vehicleSnapshot) {
        currentVehicleForEnd = vehicleRef;
        tx.update(vehicleRef, {
          assignedDriver: null,
          status: "inactive" as any,
          updatedAt: nowTs(),
        });
      } else if (!newVehicleId && !oldVehicleQuerySnapshot.empty) {
        const first = oldVehicleQuerySnapshot.docs[0];
        currentVehicleForEnd = first.ref;
        tx.update(first.ref, {
          assignedDriver: null,
          status: "inactive" as any,
          updatedAt: nowTs(),
        });
      }

      if (currentVehicleForEnd) {
        const curSnap = await getDocInTx(tx, currentVehicleForEnd);
        if (curSnap.exists) {
          const curV = curSnap.data() as Vehicle;

          const driverEndPatch: Partial<Driver> & {
            updatedAt: string;
          } = {
            updatedAt: new Date().toISOString(),
          };

          if (
            (driver as any).mileageOnEnd === undefined ||
            (driver as any).mileageOnEnd === null
          ) {
            (driverEndPatch as any).mileageOnEnd =
              (curV as any).currentMileage ?? null;
          }
          if ((driver as any).assignedVehicleId) {
            (driverEndPatch as any).assignedVehicleId = null;
          }

          tx.update(driverRef, driverEndPatch);
        }
      }
    }
  );
}

export async function cascadeDriverStatusFromVehicle(
  vehicleId: string
) {
  await db.runTransaction(
    async (tx: FirebaseFirestore.Transaction) => {
      const vehicleRef = vehiclesCollection.doc(vehicleId);
      const vehicleSnapshot = await getDocInTx(tx, vehicleRef);
      if (!vehicleSnapshot.exists) return;

      const vehicle = vehicleSnapshot.data() as Vehicle;
      const driverId = (vehicle as any).assignedDriver as
        | string
        | null;

      if (!driverId) return;

      const driverRef = driversRef.doc(driverId);
      const driverSnapshot = await getDocInTx(tx, driverRef);
      if (!driverSnapshot.exists) return;

      const driver = driverSnapshot.data() as Driver;
      const driverPatch: Partial<Driver> & { updatedAt: string } = {
        updatedAt: new Date().toISOString(),
        assignedVehicleId: vehicleId,
      };

      const needsStartStamp =
        (driver as any).mileageOnStart === undefined ||
        (driver as any).mileageOnStart === null ||
        (typeof (driver as any).mileageOnStart === "number" &&
          (driver as any).mileageOnStart <= 0);

      if (needsStartStamp) {
        (driverPatch as any).mileageOnStart =
          (vehicle as any).currentMileage ?? 0;
      }

      if ((vehicle as any).status === "inactive") {
        (driverPatch as any).status = "inactive" as any;
        if (
          (driver as any).mileageOnEnd === undefined ||
          (driver as any).mileageOnEnd === null
        ) {
          (driverPatch as any).mileageOnEnd =
            (vehicle as any).currentMileage ?? null;
        }
      } else {
        if ((driver as any).status !== "active") {
          (driverPatch as any).status = "active";
        }
        (driverPatch as any).mileageOnEnd = null;
      }

      tx.update(driverRef, driverPatch);
    }
  );
}