export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'retired';
export type RouteType = 'local' | 'highway' | 'mixed';

export interface Vehicle {
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  assignedDriver?: string | null;
  status?: VehicleStatus;

  datePurchased: FirebaseFirestore.Timestamp;
  route: RouteType;
  lastServiceDate?: FirebaseFirestore.Timestamp;
  currentMileage: number;

  createdAt?: FirebaseFirestore.Timestamp;
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
  currentMileage: number | string;
}

export type VehicleUpdateDTO = Partial<VehicleCreateDTO>;