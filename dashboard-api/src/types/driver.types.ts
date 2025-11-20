// HIGHLIGHT: new split file for driver core types

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