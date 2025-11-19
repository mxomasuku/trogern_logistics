// src/pages/onboarding/CompanySetupPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/pages/auth/ThemeToggle";
import {
  useCreateCompanyMutation,
  type FleetType,
} from "@/pages/company/companyApi";
import { useAuth } from "@/state/AuthContext"; // HIGHLIGHT

export default function CompanySetupPage() {
  const navigate = useNavigate();
  const [createCompany, { isLoading, error }] = useCreateCompanyMutation();
  const { refreshClaimsFromFirebase } = useAuth(); // HIGHLIGHT

  const [companyName, setCompanyName] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [fleetType, setFleetType] = useState<FleetType | "">("");
  const [usageDescription, setUsageDescription] = useState("");
  const [formError, setFormError] = useState<string>("");

  const handleSubmit = async () => {
    setFormError("");

    if (!companyName.trim()) {
      setFormError("Please enter your company name.");
      return;
    }

    const fleet = Number(fleetSize);
    if (!fleetSize || Number.isNaN(fleet) || fleet < 1) {
      setFormError("Please enter a valid fleet size.");
      return;
    }

    const employees = Number(employeeCount);
    if (!employeeCount || Number.isNaN(employees) || employees < 1) {
      setFormError("Please enter a valid employee count.");
      return;
    }

    if (!fleetType) {
      setFormError("Please select your fleet type.");
      return;
    }

    if (!usageDescription.trim()) {
      setFormError("Describe what you want to use the dashboard for.");
      return;
    }

    const res = await createCompany({
      name: companyName.trim(),
      fleetSize: fleet,
      employeeCount: employees,
      fleetType,
      usageDescription: usageDescription.trim(),
    });

    if ("data" in res && (res.data as any)?.isSuccessful) {
      // HIGHLIGHT: after backend sets claims, pull fresh token into AuthContext
      await refreshClaimsFromFirebase(); // HIGHLIGHT

      // HIGHLIGHT: now AuthContext should have companyId + role="owner"
      navigate("/app/home", { replace: true }); // HIGHLIGHT
    } else {
      const apiErr = (res as any).error || {};
      const msg =
        apiErr?.data?.error ||
        apiErr?.error ||
        apiErr?.message ||
        "Unable to save company setup.";
      setFormError(msg);
    }
  };

  const serverError =
    (error as any)?.data?.error ||
    (error as any)?.message ||
    (error as any)?.error ||
    "";

  const showError = formError || serverError;

  return (
    <div className="relative flex min-h-screen items-center justify-center text-gray-900">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-xl p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-700">
            Set up your <span className="text-sky-500">company</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Help us configure your dashboard.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-xl shadow-2xl p-6 md:p-7">
          {showError ? (
            <div className="mb-4 text-sm rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2">
              {String(showError)}
            </div>
          ) : null}

          {/* Company Name */}
          <label className="block text-sm mb-1 text-gray-700">
            Company name
          </label>
          <Input
            placeholder="Trodjourn Logistics"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mb-3 rounded-xl bg-gray-50"
          />

          {/* Fleet Size */}
          <label className="block text-sm mb-1 text-gray-700">
            Fleet size
          </label>
          <Input
            type="number"
            placeholder="e.g. 4"
            value={fleetSize}
            onChange={(e) => setFleetSize(e.target.value)}
            className="mb-3 rounded-xl bg-gray-50"
          />

          {/* Employee Count */}
          <label className="block text-sm mb-1 text-gray-700">
            How many employees will use the dashboard?
          </label>
          <Input
            type="number"
            placeholder="e.g. 3"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            className="mb-3 rounded-xl bg-gray-50"
          />

          {/* Fleet Type */}
          <label className="block text-sm mb-1 text-gray-700">
            Fleet type
          </label>
          <select
            value={fleetType}
            onChange={(e) => setFleetType(e.target.value as FleetType | "")}
            className="mb-3 w-full rounded-xl bg-gray-50 border border-gray-300 px-3 py-2 text-gray-700"
          >
            <option value="">Select fleet type…</option>
            <option value="small taxis">Small taxis</option>
            <option value="kombis">Kombis</option>
            <option value="buses">Buses</option>
            <option value="trucks">Trucks</option>
            <option value="mixed">Mixed</option>
          </select>

          {/* Usage Description */}
          <label className="block text-sm mb-1 text-gray-700">
            What do you want to use the dashboard for?
          </label>
          <Textarea
            rows={4}
            placeholder="Daily settlements, service records, underperforming vehicles..."
            value={usageDescription}
            onChange={(e) => setUsageDescription(e.target.value)}
            className="mb-3 rounded-xl bg-gray-50"
          />

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 w-full py-3 rounded-xl font-semibold text-white shadow-lg
                       bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                       hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving…" : "Save and continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}