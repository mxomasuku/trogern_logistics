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


export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'retired';
export type RouteType = 'local' | 'highway' | 'mixed';
export type LedgerType = 'expense' | 'income';

export interface Vehicle {
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

// Payloads coming from the client (strings for dates)
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
  datePurchased: string;        // ISO string
  route: RouteType;
  lastServiceDate?: string;     // ISO string
  deliveryMileage: number;
  currentMileage: number | string;
}

export type VehicleUpdateDTO = Partial<VehicleCreateDTO>;


export interface ServiceItem {
  name: string;
  cost: number;
  date: FirebaseFirestore.Timestamp;          // Firestore
  value: string;
  vehicleMileage: number;
  serviceDueMileage: number;
  serviceDueDate: FirebaseFirestore.Timestamp; // Firestore ✔
  expectedLifespanMileage?: number;
  expectedLifespanDays?: number;
  quantity: number;
  unit: string;
}



export interface ServiceItemDTO { 
  name: string;
  cost: number 
  date: string;
  value: string;
  vehicleMileage: number         // ISO string      // per unit§
  quantity: number | string;
  unit: string;        // "pieces", "liters", etc.
}

export interface ServiceItemPrime  {
  expectedLifespanMileage: number;       // per unit
  expectedLifespanDays: number;     
  name: string;
  value: string     // per unit
} 


export interface ServiceRecord {
  vehicleId: string
  date: FirebaseFirestore.Timestamp;  // when serviced
  mechanic: string;
  cost: number;    
  serviceMileage: number;                   // total cost for this service
  condition: string;                  // e.g. "good", "requires attention"
  itemsChanged: ServiceItem[];        // line items
  notes: string | null;

  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

// DTO for incoming payload (dates as strings)
export interface ServiceRecordDTO {
  date: string;  
  vehicleId: string  
  serviceMileage: number           // ISO date string
  mechanic: string;
  cost: number | string;
  condition: string;
  itemsChanged: Array<{
    name: string;
    cost: number | string;
    quantity: number | string;
    unit: string;
  }>;
  notes?: string;
}

export interface Driver {
  name: string;
  licenseNumber: string;
  nationalId: string;
  contact: string;
  mileageOnStart: number | null;
  mileageOnEnd: number | null;
  email?: string;
  address?: string;
  dob: string; 
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

export interface IncomeLog {
  id: string;
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

export interface VehicleTargets {
  vehicleId: string;
  period: "weekly" | "monthly" | "daily";
  currency: "USD";
  grossRevenue: number; //derived from the total income logs.
  netOpProfit: number;    
  km: number;
  fuelEconomyKmPerL?: number; // or lPer100Km
  downtimeHoursMax?: number;  // maximum time a vehicle is allowed to sit per month
  maintenanceBudgetPerMonth?: number; // period budget per month
  maintenanceBudgetPerKm?: number
  depreciationMethod: "SL" | "UOP" | "DDB";  // see §3
  depreciationUsefulLifeMonths?: number;
  resellValue?: number;
  disposalMaxKm?: number;
  disposalMaxMonths?: number;
  rpkMinusCpkFloor?: number;  // minimum acceptable margin per km
  validFrom: string;          // ISO
  validTo?: string;           // ISO
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