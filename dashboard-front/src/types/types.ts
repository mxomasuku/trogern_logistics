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
  assignedDriver?: string | null;
  status: VehicleStatus;
  datePurchased: string;       
  route: RouteType;
  lastServiceDate?: string;    
  deliveryMileage: number;
  currentMileage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeLog {
  id: string;
  amount: number;
  weekEndingMileage: number;
  vehicle: string;
  driverId: string;
  driverName: string;
  note?: string;
  createdAt?: string; 
  cashDate?: string; 
  updatedAt?: string
}

export type VehicleStatus = "active" | "inactive" | "maintenance" | "retired";
export type RouteType = "local" | "highway" | "mixed";


export type VehicleCreateDTO = Omit<Vehicle, "id" | "createdAt" | "updatedAt">;
export type VehicleUpdateDTO = Partial<VehicleCreateDTO>;