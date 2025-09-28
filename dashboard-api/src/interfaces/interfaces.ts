

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
  assignedDriver?: string | null;
  status: VehicleStatus;

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
  color?: string;
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
  cost: number;        // per unit
  quantity: number;
  unit: string;        // "pieces", "liters", etc.
}

export interface ServiceRecord {
  vehicleId: string
  date: FirebaseFirestore.Timestamp;  // when serviced
  mechanic: string;
  cost: number;                       // total cost for this service
  condition: string;                  // e.g. "good", "requires attention"
  itemsChanged: ServiceItem[];        // line items
  notes: string | null;

  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

// DTO for incoming payload (dates as strings)
export interface ServiceRecordDTO {
  date: string;  
  vehicleId: string             // ISO date string
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
  createdAt: string; 
  updatedAt?: string;
  cashDate: string; 
}