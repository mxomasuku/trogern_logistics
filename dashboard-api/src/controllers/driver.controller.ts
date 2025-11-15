import { Request, Response } from 'express';
const { db, admin} = require('../config/firebase');
import type { QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import { success, failure } from '../utils/apiResponse';
import { Driver, Vehicle } from '../interfaces/interfaces';
import { updateVehicleStatusFromDriver} from './status_sync_repo';
const driversRef = db.collection('drivers');
const nowTs = () => admin.firestore.Timestamp.now();
const vehiclesCollection = db.collection("vehicles");




export const getAllDrivers = async (_req: Request, res: Response) => {
  try {
    const snapshot = await driversRef.get();
    const drivers = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(success(drivers));
  } catch (error: any) {
    console.error('Error fetching drivers:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to fetch drivers', error.message));
  }
};

export const getDriverById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const doc = await driversRef.doc(id).get();
    if (!doc.exists) {
      return res
        .status(404)
        .json(failure('NOT_FOUND', 'Driver not found', { id }));
    }

    const payload = { id: doc.id, ...doc.data() };
    return res.status(200).json(success(payload));
  } catch (error: any) {
    console.error('Error fetching driver by id:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to fetch driver', error.message));
  }
};


export const addDriver = async (
  req: Request<{}, {}, Driver>,
  res: Response
) => {
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

  // Remove spaces from licenseNumber
  const cleanLicenseNumber = licenseNumber?.replace(/\s+/g, '') || '';

  // Validate required fields
  const missingFields: string[] = [];
  if (!name) missingFields.push('name');
  if (!contact) missingFields.push('contact');
  if (!cleanLicenseNumber) missingFields.push('licenseNumber');
  if (!nationalId) missingFields.push('nationalId');
  if (!dob) missingFields.push('dob');
  if (!gender) missingFields.push('gender');
  if (!nextOfKin?.name) missingFields.push('nextOfKin.name');
  if (!nextOfKin?.phone) missingFields.push('nextOfKin.phone');
  if (!emergencyContact) missingFields.push('emergencyContact');
  if (missingFields.length > 0) {
    return res
      .status(400)
      .json(
        failure(
          'VALIDATION_ERROR',
          'Missing required fields',
          { missingFields }
        )
      );
  }

  try {
    const now = new Date().toISOString();
    const driverData: Driver = {
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
      isActive : status == "active" ? true : false,
    };

    const docRef = driversRef.doc(cleanLicenseNumber);

    // Check if driver with same licenseNumber already exists
    const existing = await docRef.get();
    if (existing.exists) {
      return res
        .status(409)
        .json(
          failure(
            'DUPLICATE_LICENSE',
            `Driver with license number "${cleanLicenseNumber}" already exists`
          )
        );
    }

    // Save driver
    await docRef.set({
      ...driverData,
      createdAt: now,
      updatedAt: now,
    });

    await reconcileDriverVehicleAssignment(cleanLicenseNumber);

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
    console.error('Error adding driver:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to add driver', error.message));
  }
};


// EDITED VERSION
export const updateDriver = async (req: Request, res: Response) => {
  const { id } = req.params;
  const patch = { ...req.body, updatedAt: new Date().toISOString() };

  try {
    const driverRef = driversRef.doc(id);                          // EDITED
    const existingSnap = await driverRef.get();                    // EDITED

    if (!existingSnap.exists) {                                    // EDITED
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Driver not found", { id }));
    }

    const existingDriver = existingSnap.data() as Driver;          // EDITED

    // EDITED: capture previous vehicle id BEFORE we write the patch
    const previousVehicleIdRaw =
      (existingDriver as any).assignedVehicleId ??
      (existingDriver as any).assignedVehicle ??
      null;

    const previousVehicleId =
      typeof previousVehicleIdRaw === "string" && previousVehicleIdRaw.trim()
        ? previousVehicleIdRaw.trim()
        : null;
    // EDITED END

    await driverRef.set(patch, { merge: true });

    // EDITED: let helper see the previous vehicle id
    await updateVehicleStatusFromDriver(id, previousVehicleId);
    // EDITED END

    return res.status(200).json(success({ id, ...patch }));
  } catch (error: any) {
    console.error("Error updating driver:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to update driver", error.message));
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
      const dRef = driversRef.doc(id);
      const dSnap = await getDocInTx(tx, dRef); // ✅ always DocumentSnapshot
      if (!dSnap.exists) return; // nothing to do

      const d = dSnap.data() as Driver;

      // If the driver is assigned to any vehicle, stamp end mileage & detach
      let vehicleToDetach: FirebaseFirestore.DocumentReference | null = null;

      if (d.assignedVehicleId) {
        vehicleToDetach = vehiclesCollection.doc(d.assignedVehicleId);
      } else {
        // QuerySnapshot: use .empty / .docs only
        const qSnap = await vehiclesCollection.where("assignedDriver", "==", id).get();
        if (!qSnap.empty) {
          vehicleToDetach = qSnap.docs[0].ref;
        }
      }

      if (vehicleToDetach) {
        const vSnap = await getDocInTx(tx, vehicleToDetach); // ✅ DocumentSnapshot
        if (vSnap.exists) {
          const v = vSnap.data() as Vehicle;

          tx.update(dRef, {
            mileageOnEnd:
              d.mileageOnEnd === undefined || d.mileageOnEnd === null
                ? (v as any).currentMileage ?? null
                : d.mileageOnEnd,
            updatedAt: new Date().toISOString(),
          });

          tx.update(vehicleToDetach, {
            assignedDriver: null,
            status: "inactive" as any, // adjust if you have a strict VehicleStatus type
            updatedAt: nowTs(),
          });
        }
      }

      // Now delete the driver
      tx.delete(dRef);
    });

    return res.status(200).json(success({ id }));
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to delete driver", error.message));
  }
};

export const searchDrivers = async (req: Request, res: Response) => {
  const { name } = req.params;              // ← params, not query

  if (!name || typeof name !== "string") {
    return res
      .status(400)
      .json(failure("MISSING_PARAM", "Path parameter 'name' is required"));
  }

  try {
    const searchTerm = name.trim().toLowerCase();

    const snapshot = await driversRef
      .orderBy("nameLower")                 // make sure you store this on create/update
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
      .json(failure("SERVER_ERROR", "Failed to search drivers", error.message));
  }
};

export const getAllActiveDrivers = async (req: Request, res: Response) => {
  try {

    const snapshot = await driversRef
      .where("status", "==", "active")
      .get();

    const drivers = snapshot.docs
      .map((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      })


    return res.status(200).json(success(drivers));
  } catch (error: any) {
    console.error("Error fetching active drivers:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch active drivers", error.message));
  }
};


export const getAllInactiveDrivers = async (req: Request, res: Response) => {
  try {

const snapshot = await driversRef
  .where("status", "not-in", ["active"])
  .get();

    const drivers = snapshot.docs
      .map((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      })


    return res.status(200).json(success(drivers));
  } catch (error: any) {
    console.error("Error fetching active drivers:", error);
    return res
      .status(500)
      .json(failure("SERVER_ERROR", "Failed to fetch active drivers", error.message));
  }
};

const getDocInTx = async (
  tx: FirebaseFirestore.Transaction,
  ref: FirebaseFirestore.DocumentReference
): Promise<FirebaseFirestore.DocumentSnapshot> => {
  // Admin SDK Transaction#get only returns DocumentSnapshot,
  // but we cast anyway to disambiguate if web types sneak in.
  return (tx.get(ref) as unknown) as Promise<FirebaseFirestore.DocumentSnapshot>;
};

export async function reconcileDriverVehicleAssignment(driverId: string) {

  const driverPre = await driversRef.doc(driverId).get();
  if (!driverPre.exists) return;

  const driver = driverPre.data() as Driver;

  const newVehicleId = driver.assignedVehicleId || null;
  const isDriverActive = (driver.status === "active" || driver.isActive === true) && !!newVehicleId;

  // QuerySnapshot -> only use .empty / .docs
  const oldVehicleQuerySnapshot = await vehiclesCollection
    .where("assignedDriverId", "==", driverId)
    .get();

  await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
    // Re-fetch driver inside txn
    const driverRef = driversRef.doc(driverId);
    const driverSnapshot = await getDocInTx(tx, driverRef);
    if (!driverSnapshot.exists) return;
    const driver = driverSnapshot.data() as Driver;

    // If driver points to a vehicle, fetch it as a DocumentSnapshot
    let vehicleRef: FirebaseFirestore.DocumentReference | null = null;
    let vehicleSnapshot: FirebaseFirestore.DocumentSnapshot | null = null;

    if (newVehicleId) {
      const ref = vehiclesCollection.doc(newVehicleId);
      const snap = await getDocInTx(tx, ref);

      if (!snap.exists) {
        // Driver points to a non-existent vehicle -> clear link and bail
        tx.update(driverRef, {
          assignedVehicleId: null,
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      // promote to outer vars
      vehicleRef = ref;
      vehicleSnapshot = snap;
    }

    // 1) Detach this driver from any *other* vehicles that still reference them
    for (const doc of oldVehicleQuerySnapshot.docs) {
      if (!newVehicleId || doc.id !== newVehicleId) {
        tx.update(doc.ref, {
          assignedDriverId: null,
          updatedAt: nowTs(),
        });
      }
    }

    // 2) Active driver + valid target vehicle -> attach & seed mileageOnStart if needed
    if (isDriverActive && vehicleRef && vehicleSnapshot) {
      const v = vehicleSnapshot.data() as Vehicle;

      const vehiclePatch: Partial<Vehicle> & { updatedAt: FirebaseFirestore.Timestamp } = {
        assignedDriverId: driverId,
    
        updatedAt: nowTs(),
      };
      if ((v as any).status === "inactive") {
        // adjust if your VehicleStatus differs
        (vehiclePatch as any).status = "active";
      }
      tx.update(vehicleRef, vehiclePatch);

      const needsStartStamp =
        driver.mileageOnStart === undefined ||
        driver.mileageOnStart === null ||
        (typeof driver.mileageOnStart === "number" && driver.mileageOnStart <= 0);

      const driverPatch: Partial<Driver> & { updatedAt: string } = {
        assignedVehicleId: vehicleRef.id,
        mileageOnEnd: null, // new stint starts -> clear end
        updatedAt: new Date().toISOString(),
      };
      if (needsStartStamp) {
        driverPatch.mileageOnStart = (v as any).currentMileage ?? 0;
      }

      tx.update(driverRef, driverPatch);
      return; // done
    }

    // 3) Otherwise (inactive / no vehicle): detach and stamp mileageOnEnd once
    let currentVehicleForEnd: FirebaseFirestore.DocumentReference | null = null;

    if (vehicleRef && vehicleSnapshot) {
      // Driver points to a vehicle but isn't active -> detach from that vehicle
      currentVehicleForEnd = vehicleRef;
      tx.update(vehicleRef, {
        assignedDriver: null,
        status: "inactive" as any, // optional: reflect no-driver state
        updatedAt: nowTs(),
      });
    } else if (!newVehicleId && !oldVehicleQuerySnapshot.empty) {
      // Driver no longer points to any vehicle, but some vehicle still references them -> clear it
      const first = oldVehicleQuerySnapshot.docs[0];
      currentVehicleForEnd = first.ref;
      tx.update(first.ref, {
        assignedDriver: null,
        status: "inactive" as any, // optional
        updatedAt: nowTs(),
      });
    }

    // Stamp mileageOnEnd from the vehicle we just detached, if not already stamped
    if (currentVehicleForEnd) {
      const curSnap = await getDocInTx(tx, currentVehicleForEnd);
      if (curSnap.exists) {
        const curV = curSnap.data() as Vehicle;

        const driverEndPatch: Partial<Driver> & { updatedAt: string } = {
          updatedAt: new Date().toISOString(),
        };

        if (driver.mileageOnEnd === undefined || driver.mileageOnEnd === null) {
          driverEndPatch.mileageOnEnd = (curV as any).currentMileage ?? null;
        }
        if (driver.assignedVehicleId) {
          driverEndPatch.assignedVehicleId = null;
        }

        tx.update(driverRef, driverEndPatch);
      }
    }
  });
}

export async function cascadeDriverStatusFromVehicle(vehicleId: string) {
  await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
    const vehicleRef = vehiclesCollection.doc(vehicleId);
    const vehicleSnapshot  = await getDocInTx(tx, vehicleRef);               // ✅ always a DocumentSnapshot
    if (!vehicleSnapshot.exists) return;

    const vehicle = vehicleSnapshot.data() as Vehicle;
    const driverId = (vehicle  as any).assignedDriver as string | null;

    if (!driverId) return; // nothing to sync

    const driverRef = driversRef.doc(driverId);
    const driverSnapshot = await getDocInTx(tx, driverRef);               // ✅ always a DocumentSnapshot
    if (!driverSnapshot.exists) return;

    const driver = driverSnapshot.data() as Driver;
    const driverPatch: Partial<Driver> & { updatedAt: string } = {
      updatedAt: new Date().toISOString(),
      assignedVehicleId: vehicleId,
    };

    // Seed mileageOnStart if missing/zeroish
    const needsStartStamp =
      driver.mileageOnStart === undefined ||
      driver.mileageOnStart === null ||
      (typeof driver.mileageOnStart === "number" && driver.mileageOnStart <= 0);

    if (needsStartStamp) {
      driverPatch.mileageOnStart = (vehicle  as any).currentMileage ?? 0;
    }

    // Reflect vehicle status onto driver + mileageOnEnd
    if ((vehicle as any).status === "inactive") {
      driverPatch.status = "inactive" as any; // tighten if you have VehicleStatus/Driver.status types
      if (driver.mileageOnEnd === undefined || driver.mileageOnEnd === null) {
        driverPatch.mileageOnEnd = (vehicle as any).currentMileage ?? null;
      }
    } else {
      if (driver.status !== "active") driverPatch.status = "active";
      driverPatch.mileageOnEnd = null;
    }

    tx.update(driverRef, driverPatch);
  });
}