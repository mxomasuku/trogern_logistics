// src/pages/onboarding/TargetPreviewPage.tsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createIncomeTarget } from "@/api/targets"; // HIGHLIGHT
import type { CreateIncomeTargetPayload } from "@/api/targets"; // HIGHLIGHT

type LocationState = {
  targetDraft?: CreateIncomeTargetPayload;
  fleetSize?: number;
  employeeCount?: number;
};



export default function TargetPreviewPage(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const targetDraft = state.targetDraft;
  const fleetSize = state.fleetSize ?? 1;
  const employeeCount = state.employeeCount ?? 1;

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // HIGHLIGHT: if no draft, send user back
  if (!targetDraft) {
    return (
      <div className="max-w-xl mx-auto px-6 py-10 space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">
          No targets to review
        </h1>
        <p className="text-sm text-slate-600">
          Go back and configure your company targets first.
        </p>
        <button
          onClick={() => navigate("/onboarding/create-targets")}
          className="mt-4 px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
        >
          Back to target setup
        </button>
      </div>
    );
  }

  // ==========================
  // RECONSTRUCT SNAPSHOT FROM PAYLOAD
  // ==========================
  const weeklyIncome = targetDraft.weeklyCompanyIncomeTarget;
  const weeklyFuelCostTarget = targetDraft.fuelCostsWeeklyTarget;

  const serviceExpensePercentage =
    targetDraft.serviceExpensesPercentageTarget;
  const employeeExpensePercentage =
    targetDraft.employeeExpensesPercentageTarget;
  const totalExpensePercentage =
    targetDraft.totalExpensesPercentageTarget;


  const perVehicleWeeklyIncome = useMemo(
    () => (fleetSize > 0 ? weeklyIncome / fleetSize : 0),
    [weeklyIncome, fleetSize]
  );

  const weeklyServiceExpense =
    (serviceExpensePercentage / 100) * weeklyIncome;
  const weeklyEmployeeExpense =
    (employeeExpensePercentage / 100) * weeklyIncome;
  const weeklyTotalExpenseCap =
    (totalExpensePercentage / 100) * weeklyIncome;

  const rawExpensesSum =
    weeklyFuelCostTarget + weeklyServiceExpense + weeklyEmployeeExpense;
  const weeklyProfitApprox = weeklyIncome - rawExpensesSum;

  const expenseRatio =
    weeklyIncome > 0 ? Math.min(rawExpensesSum / weeklyIncome, 1) : 0;
  const profitRatio =
    weeklyIncome > 0 ? Math.max(weeklyProfitApprox / weeklyIncome, 0) : 0;

  const safeExpenseRatio = Math.max(0, Math.min(expenseRatio, 1));
  const safeProfitRatio = Math.max(0, Math.min(profitRatio, 1));

  // ==========================
  // HIGHLIGHT: CONFIRM HANDLER
  // ==========================
  async function handleConfirm() {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createIncomeTarget(targetDraft!);
      navigate("/app/manage-company");
    } catch (error: any) {
      setErrorMessage(
        error?.message || "Failed to save company targets"
      );
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Review company targets
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              This is the snapshot your dashboard will use for target-based
              analytics. Confirm if these numbers match how you want the
              business to behave week to week.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Fleet size: {fleetSize} vehicles · Employees: {employeeCount}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Back and edit
          </button>
        </div>

        {/* HIGHLIGHT: same weekly snapshot visual, centered */}
        <section className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-slate-50 shadow-lg">
          <h2 className="text-sm font-semibold mb-2">
            Weekly snapshot preview
          </h2>
          <p className="text-xs text-slate-300 mb-4">
            Targets derived from your weekly income goal and expense
            percentages.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs mb-4">
            <div className="rounded-xl bg-slate-800/70 p-3">
              <p className="text-slate-400 mb-1">Weekly income target</p>
              <p className="text-sm font-semibold">
                {weeklyIncome.toFixed(2)} USD
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/70 p-3">
              <p className="text-slate-400 mb-1">
                Approx. weekly profit (target)
              </p>
              <p className="text-sm font-semibold">
                {weeklyProfitApprox.toFixed(2)} USD
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Income vs expenses</span>
              <span>
                {Math.round(safeExpenseRatio * 100)}% expenses ·{" "}
                {Math.round(safeProfitRatio * 100)}% profit
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-rose-500/80"
                style={{ width: `${safeExpenseRatio * 100}%` }}
              />
              <div
                className="h-full bg-emerald-500/80"
                style={{ width: `${safeProfitRatio * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Total expense cap:{" "}
              <span className="font-semibold">
                {totalExpensePercentage.toFixed(1)}% of income
              </span>{" "}
              ({weeklyTotalExpenseCap.toFixed(2)} USD)
            </p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <PreviewRow
              label="Fuel costs (target)"
              value={weeklyFuelCostTarget}
              income={weeklyIncome}
            />
            <PreviewRow
              label="Service expenses"
              value={weeklyServiceExpense}
              income={weeklyIncome}
            />
            <PreviewRow
              label="Employee expenses"
              value={weeklyEmployeeExpense}
              income={weeklyIncome}
            />
          </div>

          <div className="mt-4 text-[11px] text-slate-400 border-t border-slate-700 pt-2">
            <p>
              Per vehicle weekly income target:{" "}
              <span className="font-semibold text-slate-100">
                {perVehicleWeeklyIncome.toFixed(2)} USD
              </span>
            </p>
            <p>
              Employees: {employeeCount} · Rough income per employee:{" "}
              <span className="font-semibold text-slate-100">
                {employeeCount > 0
                  ? (weeklyIncome / employeeCount).toFixed(2)
                  : "0.00"}{" "}
                USD
              </span>
            </p>
          </div>
        </section>

        {errorMessage && (
          <p className="text-xs text-rose-600">{errorMessage}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-sm hover:bg-slate-100"
          >
            Back and edit
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="px-5 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Confirm targets"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PreviewRowProps {
  label: string;
  value: number;
  income: number;
}

function PreviewRow({
  label,
  value,
  income,
}: PreviewRowProps): React.JSX.Element {
  const ratio = income > 0 ? (value / income) * 100 : 0;
  return (
    <div className="flex justify-between">
      <span className="text-slate-300">{label}</span>
      <span className="text-slate-100">
        {value.toFixed(2)} USD · {ratio.toFixed(1)}%
      </span>
    </div>
  );
}