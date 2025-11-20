import type { Request as ExpressRequest } from "express"; // HIGHLIGHT
import type { DecodedIdToken } from "firebase-admin/auth"; // HIGHLIGHT

// HIGHLIGHT: optional helper type for clarity
export interface AuthenticatedUser {                      // HIGHLIGHT
  uid: string;                                            // HIGHLIGHT
  companyId?: string;                                     // HIGHLIGHT
  email: string;     
  role?: string;                                     // HIGHLIGHT
}                                                         // HIGHLIGHT

// HIGHLIGHT: extend the Express Request, not the DOM Request
export interface AuthenticatedRequest extends ExpressRequest { // HIGHLIGHT
  firebaseUser?: DecodedIdToken;      // HIGHLIGHT
  user?: AuthenticatedUser;    // HIGHLIGHT                                 // HIGHLIGHT
}   