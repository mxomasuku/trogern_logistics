import { Request, Response } from 'express';
const { db } = require('../config/firebase');
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { success, failure } from '../utils/apiResponse';

// Firestore collection ref
const driversRef = db.collection('drivers');

export interface Driver {
  name: string;
  licenseNumber: string;
  nationalId: string;
  contact: string;
  email?: string;
  address?: string;
  dob: string; // ISO date
  gender: 'Male' | 'Female' | 'Other';
  status: 'active' | 'inactive' | 'suspended';
  experienceYears?: number;
  assignedVehicleId: string | null;
  nextOfKin: {
    name: string;
    relationship?: string;
    phone: string;
  };
  emergencyContact: string;
  isActive?: boolean; // optional toggle
}

// GET /drivers
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

// GET /drivers/:id
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

// POST /drivers/add
export const addDriver = async (
  req: Request<{}, {}, Driver>,
  res: Response
) => {
  const {
    name,
    contact,
    address = '',
    licenseNumber,
    nationalId,
    assignedVehicleId = null,
    status = 'inactive',
    dob,
    gender,
    experienceYears = 0,
    nextOfKin,
    emergencyContact,
    email = '',
    isActive = true,
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
      isActive,
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


// PUT /drivers/:id
export const updateDriver = async (req: Request, res: Response) => {
  const { id } = req.params;
  const patch = { ...req.body, updatedAt: new Date().toISOString() };

  try {
    await driversRef.doc(id).set(patch, { merge: true });
    return res.status(200).json(success({ id, ...patch }));
  } catch (error: any) {
    console.error('Error updating driver:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to update driver', error.message));
  }
};

// DELETE /drivers/:id
export const deleteDriver = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await driversRef.doc(id).delete();
    return res.status(200).json(success({ id }));
  } catch (error: any) {
    console.error('Error deleting driver:', error);
    return res
      .status(500)
      .json(failure('SERVER_ERROR', 'Failed to delete driver', error.message));
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