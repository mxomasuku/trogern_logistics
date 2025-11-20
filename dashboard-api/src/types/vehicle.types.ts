// HIGHLIGHT: new split file for vehicle domain types

export type VehicleStatus = "active" | "inactive" | "maintenance" | "retired";
export type RouteType = "local" | "highway" | "mixed";

export interface Vehicle {
  companyId: string; 
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