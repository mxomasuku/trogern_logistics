import type { Request as ExpressRequest } from "express"; // HIGHLIGHT

// HIGHLIGHT: optional helper type for clarity
export interface AuthenticatedUser {                      // HIGHLIGHT
  uid: string;                                            // HIGHLIGHT
  companyId?: string;                                     // HIGHLIGHT
  email: string;                                          // HIGHLIGHT
}                                                         // HIGHLIGHT

// HIGHLIGHT: extend the Express Request, not the DOM Request
export interface AuthenticatedRequest extends ExpressRequest { // HIGHLIGHT
  user: AuthenticatedUser;                                     // HIGHLIGHT
}   