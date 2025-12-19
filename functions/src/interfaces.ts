// HIGHLIGHT: updated interfaces for Cloud Function use

export type ServiceItemKind = "consumable" | "labour" | "license" | "other";

export interface ServiceItemPrime {
  // HIGHLIGHT: company-scoped catalog
  companyId: string; // HIGHLIGHT
  kind: ServiceItemKind;
  name: string;
  value: string;
  expectedLifespanMileage: number | null;
  expectedLifespanDays: number | null;
}

export interface ServiceItem {
  kind: ServiceItemKind;
  // HIGHLIGHT: carry companyId on each item
  companyId: string; // HIGHLIGHT
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
  // HIGHLIGHT: service record belongs to a company
  companyId: string; // HIGHLIGHT
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
// export interface VehicleServiceTrackerSummary {
//   vehicleId: string;
//   // HIGHLIGHT: multi-tenant tracker
//   companyId: string; // HIGHLIGHT
//   lastServiceDate: FirebaseFirestore.Timestamp | null;
//   lastServiceMileage: number | null;
//   updatedAt: FirebaseFirestore.Timestamp;
// }

// // Per-item tracker at: vehicleServiceTracker/{vehicleId}/items/{itemKey}
// export interface VehicleServiceTrackerItemDoc {
//   vehicleId: string;
//   // HIGHLIGHT: company on each tracker item as well
//   companyId: string; // HIGHLIGHT
//   kind: ServiceItemKind;
//   name: string;
//   value: string;
//   lastChangedAt: FirebaseFirestore.Timestamp;
//   lastChangedMileage: number;
//   dueForChangeOnDate: FirebaseFirestore.Timestamp | null;
//   dueForChangeOnMileage: number | null;
//   lastServiceRecordDocId: string;
//   createdAt: FirebaseFirestore.Timestamp;
//   updatedAt: FirebaseFirestore.Timestamp;
// }


// HIGHLIGHT: REPLACED SUMMARY + ITEM DOC WITH FLATTENED DOC SHAPE
export interface VehicleServiceTrackerItemState {
  kind: ServiceItemKind;
  name: string;
  value: string;
  lastChangedAt: FirebaseFirestore.Timestamp; // HIGHLIGHT: Timestamp type
  lastChangedMileage: number;
  dueForChangeOnDate: FirebaseFirestore.Timestamp | null; // HIGHLIGHT: Timestamp type
  dueForChangeOnMileage: number | null;
  lastServiceRecordDocId: string;
  createdAt: FirebaseFirestore.Timestamp; // HIGHLIGHT: Timestamp type
  updatedAt: FirebaseFirestore.Timestamp; // HIGHLIGHT: Timestamp type
}

// HIGHLIGHT: central state doc for all cron logic
export interface VehicleServiceTrackerDoc {
  vehicleId: string;
  companyId: string;

  // service aggregation
  lastServiceDate: FirebaseFirestore.Timestamp | null; // HIGHLIGHT: Timestamp type
  lastServiceMileage: number | null;
  nextServiceDueDate: FirebaseFirestore.Timestamp | null; // HIGHLIGHT: Timestamp type
  nextServiceDueMileage: number | null;

  // income aggregation
  lastIncomeLogAt: FirebaseFirestore.Timestamp | null; // HIGHLIGHT: Timestamp type

  // optional
  currentMileage?: number | null;

  updatedAt: FirebaseFirestore.Timestamp; // HIGHLIGHT: Timestamp type

  items: Record<string, VehicleServiceTrackerItemState>;
}

// HIGHLIGHT: report doc
export type ReportPeriod = "weekly" | "monthly" | "quarterly";

export interface CompanyReportSnapshot {
  companyId: string;
  period: ReportPeriod;
  periodStart: FirebaseFirestore.Timestamp;
  periodEnd: FirebaseFirestore.Timestamp;
  generatedAt: FirebaseFirestore.Timestamp;

  // numbers you care about:
  totalIncome: number;
  totalExpenses: number;
  kmDriven: number;
  serviceCount: number;
  overdueServiceCount: number;
  // etc
}