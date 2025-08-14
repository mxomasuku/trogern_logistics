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
