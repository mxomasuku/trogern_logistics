import { Timestamp } from "firebase-admin/firestore";

export interface ApiResponse<T = any> {
  isSuccessful: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export type VehicleStatus = "active" | "inactive" | "maintenance" | "retired";
export type RouteType = "local" | "highway" | "mixed";
export type LedgerType = "expense" | "income";

export interface Vehicle {
  companyId: string; // HIGHLIGHT: multi-tenant
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  status: VehicleStatus;
  price: number;
  datePurchased: FirebaseFirestore.Timestamp;
  route?: RouteType;
  lastServiceDate?: FirebaseFirestore.Timestamp;
  deliveryMileage: number;
  currentMileage: number;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

export interface VehicleCreateDTO {
  plateNumber: string;
  make: string;
  model: string;
  year: number | string;
  color: string;
  price: number;
  vin: string;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  status?: VehicleStatus;
  datePurchased: string; // ISO string
  route: RouteType;
  lastServiceDate?: string; // ISO string
  deliveryMileage: number;
  currentMileage: number | string;
}

export type VehicleUpdateDTO = Partial<VehicleCreateDTO>;

export type ServiceItemKind = "consumable" | "labour" | "license" | "other";

/* ───────────────────── SERVICE ITEMS & CATALOG ───────────────────── */

// HIGHLIGHT: concrete service item instance on a specific record
export interface ServiceItem {
  kind: ServiceItemKind;
  companyId: string; // HIGHLIGHT: tenant scoping for items
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

// HIGHLIGHT: Catalog “prime” definitions per company
export interface ServiceItemPrime {
  companyId: string; // HIGHLIGHT: catalog is per-company
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
  companyId: string; // HIGHLIGHT: used in queries and auth checks
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

/* ───────────────────────────── DRIVERS ───────────────────────────── */

export interface Driver {
  name: string;
  companyId: string;
  licenseNumber: string;
  nationalId: string;
  contact: string;
  mileageOnStart: number | null;
  mileageOnEnd: number | null;
  email?: string;
  address?: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  status: "active" | "inactive" | "suspended";
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

/* ───────────────────────────── INCOME ───────────────────────────── */

export interface IncomeLog {
  id: string;
  companyId: string;
  amount: number;
  type: LedgerType;
  weekEndingMileage: number;
  vehicle: string;
  driverId: string;
  driverName: string;
  note?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  cashDate: FirebaseFirestore.Timestamp;
}

/* ───────────────────── VEHICLE TARGETS & KPIs ───────────────────── */

export interface VehicleTargets {
  vehicleId: string;
  companyId: string;
  period: "weekly" | "monthly" | "daily";
  currency: "USD";
  grossRevenue: number;
  netOpProfit: number;
  km: number;
  fuelEconomyKmPerL?: number;
  downtimeHoursMax?: number;
  maintenanceBudgetPerMonth?: number;
  maintenanceBudgetPerKm?: number;
  depreciationMethod: "SL" | "UOP" | "DDB";
  depreciationUsefulLifeMonths?: number;
  resellValue?: number;
  disposalMaxKm?: number;
  disposalMaxMonths?: number;
  rpkMinusCpkFloor?: number;
  validFrom: string; // ISO
  validTo?: string; // ISO
}

export type DriverKpis = {
  avgWeeklyKm: number; // rounded
  cash30d: number; // USD total last 30 days
  incidentsYTD: number; // integer
  earningsPerKm: number; // last 8 logs, amount / km
};

export interface DriverKpiMeta {
  logsCount: number;
  logs30Count: number;
  kmAll: number;
  km30: number;
}

export interface DriverKpiResult {
  vehicleId: string;

  // Aggregated totals
  totalNet: number;
  totalIncomeGross: number;
  totalExpenseGross: number;

  // Last 30-day window
  net30d: number;
  income30dGross: number;
  expense30dGross: number;

  // Per-kilometer performance
  earningsPerKmTotal: number;
  earningsPerKm30d: number;

  // Average performance (last 8 logs)
  avgWeeklyKmLast8: number;
  avgWeeklyNetLast8: number;

  // Mileage / lifetime metrics
  mileageOnStart: number;
  latestMileage: number;
  coveredKmSinceStart: number;

  // Derived income efficiency
  incomePerKmSinceStartNet: number;
  incomePerKmSinceStartIncomeOnly: number;

  // Metadata summary
  meta: DriverKpiMeta;
}

export interface VehicleKpiSlice {
  totalEntries: number;
  totalIncome: number;
  totalExpense: number;
  netEarnings: number;
  distanceTravelledKm: number;
  revenuePerKm: number | null;
  costPerKm: number | null;
  profitPerKm: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  lastEntryAt: string | null;
}

export interface VehicleKpiMeta {
  generatedAt: string;
  totalLogs: number;
  lastMileage: number | null;
  deliveryMileage: number | null;
  lastEntryAt: string | null;
  daysSincePurchase: number | null;
}

export interface VehicleKpiResponse {
  vehicleId: string;
  meta: VehicleKpiMeta;
  kpis: {
    last7Days: VehicleKpiSlice;
    last30Days: VehicleKpiSlice;
    lifetime: VehicleKpiSlice;
  };
}

/* ───────────────────────── COMPANY DOC ───────────────────────── */

export type FleetType = "small taxis" | "kombis" | "buses" | "trucks" | "mixed";

export interface CompanyDoc {
  companyId: string;
  ownerUid: string;
  name: string;
  fleetSize: number;
  employeeCount: number;
  fleetType: FleetType;
  usageDescription: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;

}

export type AppUserRole = "owner" | "manager" | "employee";

export type InviteRole = Exclude<AppUserRole, "owner">; // only "manager" | "employee"

export interface CompanyInviteDoc {
  companyId: string;
  role: InviteRole;
  createdByUid: string;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  used: boolean;
  usedByUid?: string;
  usedAt?: FirebaseFirestore.Timestamp;
  email: string;              // HIGHLIGHT: now required
  invitedUid?: string;        // HIGHLIGHT: optional strict binding
}

type AppCustomClaims = {
  companyId: string;
  role: "owner" | "manager" | "employee";
};