// src/pages/invite/InviteAcceptPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { acceptInvite } from "@/api/invites";
import { useAuth } from "@/state/AuthContext";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading, refreshClaimsFromFirebase } = useAuth();

  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link.");
      setProcessing(false);
      return;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (error) return;

    // HIGHLIGHT: wait for auth to resolve
    if (loading) return;

    // HIGHLIGHT: user not logged in → store token then redirect to login
    if (!user) {
      sessionStorage.setItem("pendingInviteToken", token);
      navigate("/login?fromInvite=1", { replace: true });
      return;
    }

    // HIGHLIGHT: user logged in → accept invite
    (async () => {
      try {
        setProcessing(true);
        await acceptInvite(token);
        await refreshClaimsFromFirebase();
        toast.success("Invite accepted. You’re now linked to the company.");

        navigate("/app/home", { replace: true });
      } catch (e: any) {
        const msg =
          e?.response?.data?.error?.message ??
          e?.message ??
          "Failed to accept invite.";
        setError(msg);
        toast.error(msg);
      } finally {
        setProcessing(false);
      }
    })();
  }, [token, user, loading, error, navigate, refreshClaimsFromFirebase]);

  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-blue-700 text-base">
              Joining company…
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing invite. Do not close this tab.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 text-base">
              Invite error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={() => navigate("/login", { replace: true })}
            >
              Go to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}