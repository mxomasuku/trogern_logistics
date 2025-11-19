// src/pages/onboarding/OnboardingEntryPage.tsx
"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Link as LinkIcon, Building2, Users } from "lucide-react";
import { toast } from "sonner";

// HIGHLIGHT: simple helper to extract token from either full URL or raw token
function extractInviteToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // full URL case: https://app.trogern.com/invite/abcd1234
  const marker = "/invite/";
  const idx = trimmed.indexOf(marker);
  if (idx !== -1) {
    const token = trimmed.slice(idx + marker.length).split(/[?#]/)[0];
    return token || null;
  }

  // fallback: treat as plain token
  return trimmed || null;
}

// HIGHLIGHT: main component
export default function OnboardingEntryPage() {
  const navigate = useNavigate();

  const [inviteInput, setInviteInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOwnerFlow = () => {
    // HIGHLIGHT: owner path → existing create-company page
    navigate("/onboarding/company");
  };

  const handleEmployeeFlow = async () => {
    const token = extractInviteToken(inviteInput);
    if (!token) {
      toast.error("Paste a valid invite link or token.");
      return;
    }

    setSubmitting(true);
    try {
      // HIGHLIGHT: employee path → invite accept page
      navigate(`/invite/${token}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 px-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* HIGHLIGHT: header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-blue-800">
            How are you using Fleet Manager?
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto">
            Choose whether you are setting up the company or joining a company that already exists.
          </p>
        </div>

        {/* HIGHLIGHT: two-path layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner card */}
          <Card className="border-0 shadow-sm rounded-2xl ring-1 ring-black/5 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <Building2 className="h-5 w-5 text-blue-700" />
                </span>
                I own or manage this fleet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <p>
                You are responsible for the vehicles, drivers, and company decisions.
                You will create the company profile and invite your team.
              </p>
              <ul className="list-disc list-inside text-xs md:text-sm space-y-1 text-slate-600">
                <li>Create your company once</li>
                <li>Invite drivers, dispatchers, and managers</li>
                <li>Control access and roles</li>
              </ul>
              <Button
                type="button"
                onClick={handleOwnerFlow}
                className="mt-2 w-full md:w-auto bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                           hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white font-semibold"
              >
                Continue as owner
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Employee card */}
          <Card className="border-0 shadow-sm rounded-2xl ring-1 ring-black/5 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
                  <Users className="h-5 w-5 text-sky-700" />
                </span>
                I was invited to a company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <p>
                Use the invite link or token sent to you by your fleet owner or manager.
              </p>

              <div className="space-y-2">
                <Label className="text-xs md:text-sm text-blue-900/80">
                  Paste invite link or token
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-2 top-2.5 h-4 w-4 text-blue-300" />
                    <Input
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      placeholder="https://app.trogern.com/invite/abc123 or abc123"
                      className="pl-8 h-10 rounded-xl border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300
                                 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleEmployeeFlow}
                    disabled={submitting}
                    className="h-10 w-full sm:w-auto bg-slate-900 text-white font-semibold
                               hover:bg-slate-800 disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4 animate-pulse" />
                        Processing…
                      </>
                    ) : (
                      <>
                        Join company
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">
                  If you do not have an invite, ask your fleet owner or manager to send you a link.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}