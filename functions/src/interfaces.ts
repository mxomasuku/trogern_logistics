export type ServiceItemKind = "consumable" | "labour" | "license" | "other";

export interface ServiceItemPrime {
  kind: ServiceItemKind;
  name: string;
  value: string;
  expectedLifespanMileage: number | null;
  expectedLifespanDays: number | null;
}

export interface ServiceItem {
  kind: ServiceItemKind;
  name: string;
  value: string;
  unit: string;
  quantity: number;
  cost: number;
  date: FirebaseFirestore.Timestamp;
  vehicleMileage: number;
  expectedLifespanMileage?: number;
  expectedLifespanDays?: number;
  serviceDueMileage?: number;
  serviceDueDate?: FirebaseFirestore.Timestamp;
}

export interface ServiceRecord {
  vehicleId: string;
  date: FirebaseFirestore.Timestamp;
  mechanic: string;
  cost: number;
  serviceMileage: number;
  notes: string | null;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

// Vehicle tracker summary at: vehicleServiceTracker/{vehicleId}
export interface VehicleServiceTrackerSummary {
  vehicleId: string;
  lastServiceDate: FirebaseFirestore.Timestamp | null;
  lastServiceMileage: number | null;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Per-item tracker at: vehicleServiceTracker/{vehicleId}/items/{itemKey}
export interface VehicleServiceTrackerItemDoc {
  vehicleId: string;
  kind: ServiceItemKind;
  name: string;
  value: string;
  lastChangedAt: FirebaseFirestore.Timestamp;
  lastChangedMileage: number;
  dueForChangeOnDate: FirebaseFirestore.Timestamp | null;
  dueForChangeOnMileage: number | null;
  lastServiceRecordDocId: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
