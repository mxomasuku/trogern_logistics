import { auth } from "firebase-admin";
import { AppUserRole } from "../types/index";


export type AppCustomClaims = {
  companyId: string;
  role: AppUserRole;
};

export async function setUserCompanyClaims(
  uid: string,
  companyId: string,
  role: AppUserRole
): Promise<void> {
  // HIGHLIGHT
  const claims: AppCustomClaims = { companyId, role };
  await auth().setCustomUserClaims(uid, claims);
}