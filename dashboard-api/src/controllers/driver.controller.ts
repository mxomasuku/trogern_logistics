import { Request, Response } from 'express';
const { db } = require('../config/firebase');
import { firestore } from 'firebase-admin';

export interface Driver {
  name: string;
  licenseNumber: string;
  nationalId: string;
  contact: string;
  email: string;
  address: string;
  dob: string; 
  gender: 'Male' | 'Female' | 'Other';
  status: 'active' | 'inactive' | 'suspended';
  experienceYears: number;
  vehicleAssigned: string;
  nextOfKin: {
    name: string;
    relationship: string;
    phone: string;
  };
  emergencyContact: string;
}

const driversRef = db.collection('drivers');

export const getAllDrivers = async (_req: Request, res: Response) => {
  try {
    const snapshot = await driversRef.get();
    const drivers = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

export const getDriverById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const doc = await driversRef.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Driver not found' });
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
};




export const addDriver = async (req: Request<{}, {}, Driver>, res: Response) => {
  const {
    name,
    contact,
    address = '',
    licenseNumber,
    nationalId,
    vehicleAssigned = '',
    status = 'inactive',
    dob,
    gender,
    experienceYears = 0,
    nextOfKin,
    emergencyContact
  } = req.body;

  const missingFields: string[] = [];

  if (!name) missingFields.push('name');
  if (!contact) missingFields.push('contact');
  if (!licenseNumber) missingFields.push('licenseNumber');
  if (!nationalId) missingFields.push('nationalId');
  if (!dob) missingFields.push('dob');
  if (!gender) missingFields.push('gender');
  if (!nextOfKin?.name) missingFields.push('nextOfKin.name');
  if (!nextOfKin?.phone) missingFields.push('nextOfKin.phone');
  if (!emergencyContact) missingFields.push('emergencyContact');

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: `Please provide the following field(s): ${missingFields.join(', ')}`,
      data: undefined
    });
  }

  try {
    const now = new Date().toISOString();
    const driverData: Driver = {
      name,
      licenseNumber,
      nationalId,
      contact,
      email: req.body.email || '',
      address,
      dob,
      gender,
      status,
      experienceYears,
      vehicleAssigned,
      nextOfKin,
      emergencyContact,
    };

    await driversRef.add({
      ...driverData,
      createdAt: now,
      updatedAt: now
    });

    res.status(200).json({
      message: `${driverData.name} added successfully`,
      data: driverData
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add driver',
      message: (error as Error).message,
      data: undefined
    });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  data.updatedAt = new Date().toISOString();

  try {
    await driversRef.doc(id).update(data);
    res.status(200).json({ message: 'Driver updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await driversRef.doc(id).delete();
    res.status(200).json({ message: 'Driver deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};