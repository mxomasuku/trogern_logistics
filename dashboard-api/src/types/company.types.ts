// HIGHLIGHT: new split file for company and auth types

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
  email: string;              // now required
  invitedUid?: string;        // optional strict binding
}

export type AppCustomClaims = {
  companyId: string;
  role: "owner" | "manager" | "employee";
};