export interface Modification {
  id: string;
  companyId: string;
  vehicleId: string;
  driverId?: string;
  driverName?: string;
  description: string;
  cost: number;
  date: FirebaseFirestore.Timestamp;
  mechanic: string;
  nextCheckDate?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}
