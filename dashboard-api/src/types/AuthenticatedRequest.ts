// src/types/AuthenticatedRequest.ts
import { Request } from "express";

export interface AuthenticatedUser {
  uid: string;
  companyId?: string | null;
  // add whatever else you attach on auth
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  authUser?: AuthenticatedUser;
}