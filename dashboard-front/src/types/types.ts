export interface ApiError {
  code?: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  isSuccessful: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  nationalId: string;
  contact: string;
  email?: string;
  address?: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  status: "active" | "inactive" | "suspended";
  experienceYears?: number;
  assignedVehicleId?: string | null;
  nextOfKin: { name: string; relationship?: string; phone: string };
  emergencyContact: string;
  createdAt?: string;
  updatedAt?: string;
}


export interface Vehicle {
  id?: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  price: number;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  status: VehicleStatus;
  datePurchased: { _seconds: number; _nanoseconds: number },
  route: RouteType;
  lastServiceDate?: { _seconds: number; _nanoseconds: number },
  deliveryMileage: number;
  currentMileage: number;
  createdAt?: string;
  updatedAt?: string;
}

export type LedgerType = 'expense' | 'income';

export interface IncomeLog {
  id: string;
  amount: number;
  type: LedgerType;
  weekEndingMileage: number;
  vehicle: string;
  driverId: string;
  driverName: string;
  note?: string;
  createdAt: { _seconds: number; _nanoseconds: number },
  updatedAt?: { _seconds: number; _nanoseconds: number },
  cashDate: { _seconds: number; _nanoseconds: number },
}

export interface ArrestLog extends IncomeLog {
  reason?: string;
  location?: string;
  ticketNumber?: string;
  source?: { kind: "arrest" };
}


export type VehicleStatus = "active" | "inactive" | "maintenance" | "retired";
export type RouteType = "local" | "highway" | "mixed";


export interface VehicleCreateDTO {
  plateNumber: string;
  make: string;
  model: string;
  year: number | string;
  color?: string;
  price: number;
  vin?: string;
  assignedDriver?: string | null;
  status?: VehicleStatus;
  datePurchased: string;        // ISO string
  route: RouteType;
  lastServiceDate?: string;     // ISO string
  deliveryMileage: number;
  currentMileage: number | string;
}

export type VehicleUpdateDTO = Partial<VehicleCreateDTO>;
// src/interfaces/interfaces.ts

export type ServiceItemKind = "consumable" | "labour" | "license" | "other";


export interface ServiceItem {
  kind: ServiceItemKind;                       // ✅ store for easy querying
  name: string;
  value: string;
  unit: string;
  quantity: number;
  cost: number;

  // core service context
  date: { _seconds: number; _nanoseconds: number },
  vehicleMileage: number;

  // derived only when lifespan present; absent for labour/etc.
  expectedLifespanMileage?: number;
  expectedLifespanDays?: number;
  serviceDueMileage?: number;
  serviceDueDate?: { _seconds: number; _nanoseconds: number },
}

// Catalog (primes you create once)
export interface ServiceItemPrime {
  kind: ServiceItemKind;
  name: string;
  value: string;
  expectedLifespanMileage: number | null;
  expectedLifespanDays: number | null;
}

export interface ServiceItemDTO {
  name: string;
  cost: number;
  date: string;             // ISO string (not used when embedded in ServiceRecordDTO.itemsChanged)
  value: string;
  vehicleMileage: number;   // per unit
  quantity: number | string;
  unit: string;
}

export interface ServiceRecord {
  vehicleId: string;
  type: string;
  date: { _seconds: number; _nanoseconds: number },
  mechanic: string;
  cost: number;
  serviceMileage: number;                  // odometer at service time                     // e.g. "good", "requires attention"
  itemsChanged: ServiceItem[];             // not embedded (kept for backward compat), we store in subcollection
  notes: string | null;
  createdAt?: { _seconds: number; _nanoseconds: number },
  updatedAt?: { _seconds: number; _nanoseconds: number },
}

// DTO from client (dates as strings)
export interface ServiceRecordDTO {
  date: string;                // ISO
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

export type DriverKpis = {
  avgWeeklyKm: number;      // rounded
  cash30d: number;          // USD total last 30 days
  incidentsYTD: number;     // integer
  earningsPerKm: number;    // last 8 logs, amount / km
}


export interface DriverKpiMeta {
  logsCount: number;
  logs30Count: number;
  kmAll: number;
  km30: number;
}

export interface DriverKpiResult {
  vehicleId: string;
  totalNet: number;
  totalIncomeGross: number;
  totalExpenseGross: number;
  net30d: number;
  income30dGross: number;
  expense30dGross: number;
  earningsPerKmTotal: number;
  earningsPerKm30d: number;
  avgWeeklyKmLast8: number;
  avgWeeklyNetLast8: number;
  mileageOnStart: number;
  latestMileage: number;
  coveredKmSinceStart: number;
  incomePerKmSinceStartNet: number;
  incomePerKmSinceStartIncomeOnly: number;
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


/* ─────────────── MILEAGE TRENDS ─────────────── */

export interface MileageTrendPoint {
  date: string;
  weekLabel: string;
  monthLabel: string;
  weekEndingMileage: number;
  distanceKm: number;
  netIncome: number;
}

export interface MileageTrendStats {
  totalWeeks: number;
  totalDistanceKm: number;
  avgWeeklyKm: number;
  highestWeekKm: number;
  highestWeekDate: string;
  lowestWeekKm: number;
  lowestWeekDate: string;
  monthlyAverages: Record<string, number>;
}

export interface MileageTrendsResponse {
  driverId: string;
  vehicleId: string;
  mileageOnStart: number;
  trends: MileageTrendPoint[];
  stats: MileageTrendStats;
}

export interface Modification {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  date: { _seconds: number; _nanoseconds: number };
  mechanic: string;
  nextCheckDate?: { _seconds: number; _nanoseconds: number };
  createdAt: { _seconds: number; _nanoseconds: number };
  updatedAt?: { _seconds: number; _nanoseconds: number };
}

export type FleetType = "small taxis" | "kombis" | "buses" | "trucks" | "mixed";

export interface CompanyDoc {
  companyId: string;
  ownerUid: string;
  name: string;
  fleetSize: number;
  employeeCount: number;
  fleetType: FleetType;
  usageDescription: string;
  createdAt: { _seconds: number; _nanoseconds: number },
  updatedAt: { _seconds: number; _nanoseconds: number },
  subscriptionStatus: "active" | "suspended" | "cancelled" | "inactive" | "trial";
  subscriptionPlan: "free" | "standard" | "premium" | "enterprise";
  subscriptionBillingProvider: "stripe" | "manual";
  subscriptionCurrentPeriodEnd: { _seconds: number; _nanoseconds: number },
  country: string;
  status: "active" | "inactive" | "blocked" | "trial";
}
