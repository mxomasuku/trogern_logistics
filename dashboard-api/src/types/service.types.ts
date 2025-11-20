// HIGHLIGHT: service items, primes, DTOs, records

export type ServiceItemKind = "consumable" | "labour" | "license" | "other";

/* ───────────────────── SERVICE ITEMS & CATALOG ───────────────────── */

// concrete service item instance on a specific record
export interface ServiceItem {
  kind: ServiceItemKind;
  companyId: string; // tenant scoping for items
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

// catalog “prime” definitions per company
export interface ServiceItemPrime {
  companyId: string; // catalog is per-company
  kind: ServiceItemKind;
  name: string;
  value: string;
  expectedLifespanMileage: number | null;
  expectedLifespanDays: number | null;
}

export interface ServiceItemDTO {
  name: string;
  cost: number;
  date: string; // ISO
  value: string;
  vehicleMileage: number;
  quantity: number | string;
  unit: string;
}

/* ───────────────────────── SERVICE RECORDS ───────────────────────── */

export interface ServiceRecord {
  vehicleId: string;
  companyId: string; // used in queries and auth checks
  date: FirebaseFirestore.Timestamp;
  mechanic: string;
  cost: number;
  serviceMileage: number;
  itemsChanged: ServiceItem[]; // items subcollection materialization
  notes: string | null;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

export interface ServiceRecordDTO {
  date: string; // ISO
  vehicleId: string;
  serviceMileage: number;
  mechanic: string;
  cost: number | string;
  itemsChanged: Array<{
    name: string;
    cost: number | string;
    quantity: number | string;
    unit: string;
  }>;
  notes?: string;
}