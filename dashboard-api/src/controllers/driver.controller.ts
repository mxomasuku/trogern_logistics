import { Request, Response } from 'express';
const { db } = require('../config/firebase');
import { firestore } from 'firebase-admin';

interface Driver {
  name: string;
  contact: string;
  address?: string;
  licenseNumber: string;
  nationalId: string;
  assignedVehicle?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export const addDriver = async (req: Request, res: Response) => {
  const {
    name,
    contact,
    address = '',
    licenseNumber,
    nationalId,
    assignedVehicle = null,
    isActive = false,
  } = req.body;

const missingFields: string[] = [];

if (!name) missingFields.push('name');
if (!contact) missingFields.push('contact');
if (!address) missingFields.push('address');
if (!licenseNumber) missingFields.push('licenseNumber');
if (!nationalId) missingFields.push('nationalId');

if (missingFields.length > 0) {
  return res.status(400).json({
    error: 'Missing required fields',
    message: `Please provide the following field(s): ${missingFields.join(', ')}`,
    data: undefined
  });
}

  try {
    const now = new Date().toISOString();
    const docRef = await driversRef.add({
      name,
      contact,
      address,
      licenseNumber,
      nationalId,
      assignedVehicle,
      isActive,
      createdAt: now,
      updatedAt: now,
    });
    console.log(docRef);
    res.status(200).json({ 
      message: `${req.body.name} added successfully`,
      data: undefined
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to add driver',
      message: error,
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