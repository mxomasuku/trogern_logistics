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
export type ServiceRecordDTO = Omit<ServiceRecord, "createdAt" | "updatedAt">;

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

export interface ServiceItem {
  name: string;
  unit: string;
  cost: number;
  quantity: number;
}

export interface ServiceRecord {
  id?: string;
  date: string; // ISO in client
  mechanic: string;
  condition: string;
  cost: number;
  serviceMileage: number;
  itemsChanged: ServiceItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  vehicleId: string
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
