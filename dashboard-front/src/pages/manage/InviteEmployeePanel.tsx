// src/pages/company/InviteEmployeesPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { sendInvite, listInvites, revokeInvite, type InviteSummary, type InviteRole } from "@/api/invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Copy, X, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

function baseInputClasses() {
  return [
    "h-9 rounded-md",
    "border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
  ].join(" ");
}

type RoleOption = {
  value: InviteRole;
  label: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  { value: "employee", label: "Employee (default)" },
  { value: "manager", label: "Manager" },
];

export default function InviteEmployeesPanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("employee");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [invites, setInvites] = useState<InviteSummary[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);

  const loadInvites = async () => {
    setLoadingInvites(true);
    try {
      const list = await listInvites();
      setInvites(list);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load invites");
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleSendInvite = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }
    // quick dumb email check
    if (!trimmedEmail.includes("@")) {
      toast.error("Invalid email address");
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendInvite({ email: trimmedEmail, role });

      const invite = res?.invite ?? res; // tolerate different shapes

      let finalUrl: string | null = null;

      if (invite?.inviteUrl) {
        finalUrl = invite.inviteUrl as string;
      } else if (invite?.token) {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        finalUrl = origin ? `${origin}/invite/${invite.token}` : null;
      }

      setLastGeneratedLink(finalUrl);
      setEmail("");

      // refresh list
      await loadInvites();

      if (finalUrl) {
        try {
          await navigator.clipboard.writeText(finalUrl);
          toast.success("Invite link created and copied to clipboard");
        } catch {
          toast.success("Invite created. Copy link below.");
        }
      } else {
        toast.success("Invite created");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async (invite: InviteSummary) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const link =
      invite.inviteUrl ??
      (origin ? `${origin}/invite/${(invite as any).token ?? invite.id}` : "");

    if (!link) {
      toast.error("No link available for this invite");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revokeInvite(inviteId);
      toast.success("Invite revoked");
      await loadInvites();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to revoke invite");
    }
  };

  const pendingInvites = useMemo(
    () => invites.filter((i) => i.status === "pending" || !i.status),
    [invites]
  );

  return (

<div>
    <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>


         <Card className="bg-white shadow-none border-0 rounded-2xl ring-1 ring-black/5">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="text-lg font-semibold text-blue-800">
          Team invitations
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadInvites}
          disabled={loadingInvites}
          className="flex items-center gap-1 text-blue-700 hover:bg-blue-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* HIGHLIGHT: Invite form */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[2fr,1.3fr,auto] gap-3 items-end">
            <div>
              <Label className="mb-1 block text-sm text-blue-900/80">
                Employee email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className={baseInputClasses()}
              />
            </div>

            <div>
              <Label className="mb-1 block text-sm text-blue-900/80">
                Role
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as InviteRole)}
                className={`${baseInputClasses()} pr-8`}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex">
              <Button
                type="button"
                onClick={handleSendInvite}
                disabled={submitting}
                className="w-full md:w-auto self-stretch bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                           hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white font-semibold"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </div>

          {lastGeneratedLink && (
            <div className="mt-2 text-xs text-slate-700 flex items-center gap-2">
              <span className="font-medium">Last invite link:</span>
              <span className="truncate max-w-[260px] sm:max-w-[420px]">
                {lastGeneratedLink}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  navigator.clipboard.writeText(lastGeneratedLink).then(
                    () => toast.success("Link copied"),
                    () => toast.error("Could not copy link")
                  )
                }
                className="shrink-0 text-blue-700 hover:bg-blue-50"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* HIGHLIGHT: Pending invites table */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-blue-900/80 mb-2">
            Pending invites
          </h3>

          {loadingInvites ? (
            <div className="flex justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading invites…
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-sm text-slate-500 py-3">
              No pending invites.
            </div>
          ) : (
            <div className="rounded-xl bg-white ring-1 ring-slate-100 overflow-hidden">
              <Table className="w-full text-sm">
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-[11px] uppercase text-slate-500">
                      Email
                    </TableHead>
                    <TableHead className="text-[11px] uppercase text-slate-500">
                      Role
                    </TableHead>
                    <TableHead className="text-[11px] uppercase text-slate-500">
                      Created
                    </TableHead>
                    <TableHead className="text-right text-[11px] uppercase text-slate-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invite) => {
                    const created = invite.createdAt
                      ? new Date(invite.createdAt)
                      : null;
                    const createdLabel = created
                      ? created.toLocaleString()
                      : "—";

                    return (
                      <TableRow key={invite.id}>
                        <TableCell>{invite.email}</TableCell>
                        <TableCell className="capitalize">
                          {invite.role}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {createdLabel}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-blue-700 hover:bg-blue-50"
                            onClick={() => handleCopyLink(invite)}
                            title="Copy invite link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleRevoke(invite.id)}
                            title="Revoke invite"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="px-3 py-2 text-[11px] text-slate-500">
                {pendingInvites.length} pending invite
                {pendingInvites.length === 1 ? "" : "s"}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

</div>

 
  );
}