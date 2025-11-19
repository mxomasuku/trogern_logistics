// src/api/invites.ts
import { http } from "@/lib/http-instance"; // HIGHLIGHT: unified http client
import type { ApiResponse } from "@/types/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InviteRole = "employee" | "manager"; // HIGHLIGHT

export type InviteStatus = "pending" | "accepted" | "revoked";

export type InviteSummary = {
  id: string;
  email: string;
  role: InviteRole;
  status: InviteStatus;
  createdAt: string;
  acceptedAt?: string | null;
  inviteUrl?: string; // backend can send full URL or just a token
  token?: string;     // optional: if you store the raw token
};

// ---------------------------------------------------------------------------
// Accept invite
// ---------------------------------------------------------------------------

/**
 * Accept an invite using the invite token.
 *
 * Expected backend response shape:
 * ApiResponse<{
 *   companyId: string;
 *   role: "employee" | "manager";
 * }>
 */
export async function acceptInvite(
  token: string
): Promise<{ companyId: string; role: string }> {
  // HIGHLIGHT: now using http + ApiResponse
  const { data } = await http.post<
    ApiResponse<{ companyId: string; role: string }>
  >(`/company-invites/${token}/accept`);

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to accept invite");
  }

  return data.data!;
}

// ---------------------------------------------------------------------------
// Send invite
// ---------------------------------------------------------------------------

/**
 * Send an invite to an email for the current company.
 *
 * Expected backend response shape:
 * ApiResponse<{
 *   invite: {
 *     id: string;
 *     email: string;
 *     role: InviteRole;
 *     inviteUrl?: string;
 *     token?: string;
 *   }
 * }>
 *
 * NOTE: The UI currently does `const res = await sendInvite(); const invite = res?.invite ?? res;`
 * so we return the inner `{ invite: ... }` object.
 */
export async function sendInvite(params: {
  email: string;
  role: InviteRole;
}): Promise<{ invite: InviteSummary & { token?: string; inviteUrl?: string } }> {
  const { data } = await http.post<
    ApiResponse<{ invite: InviteSummary & { token?: string; inviteUrl?: string } }>
  >("/company/invites", params);

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to send invite");
  }

  // HIGHLIGHT: return the wrapper `{ invite }` so existing UI (`res?.invite ?? res`) still works
  return data.data!;
}

// ---------------------------------------------------------------------------
// List invites
// ---------------------------------------------------------------------------

/**
 * List invites for the current company.
 *
 * Expected backend response shape:
 * ApiResponse<{
 *   invites: InviteSummary[];
 * }>
 */
export async function listInvites(): Promise<InviteSummary[]> {
  const { data } = await http.get<
    ApiResponse<{ invites: InviteSummary[] }>
  >("/company-invites");

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to load invites");
  }

  // HIGHLIGHT: return a flat array to the UI
  return data.data?.invites ?? [];
}

// ---------------------------------------------------------------------------
// Revoke invite
// ---------------------------------------------------------------------------

/**
 * Revoke (cancel) an invite.
 *
 * Expected backend response shape:
 * ApiResponse<null>
 */
export async function revokeInvite(inviteId: string): Promise<void> {
  const { data } = await http.post<ApiResponse<null>>(
    `/company-invites/${inviteId}/revoke`
  );

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to revoke invite");
  }
}