// src/pages/onboarding/SetTargets.tsx
import React, { useEffect, useMemo, useState } from "react"; // HIGHLIGHT
// HIGHLIGHT: new import
import { useNavigate } from "react-router-dom"; // HIGHLIGHT
// HIGHLIGHT: import payload type + API helper
import type { CreateIncomeTargetPayload } from "@/api/targets"; // HIGHLIGHT
import { getActiveTargets } from "@/api/targets"; // HIGHLIGHT

// HIGHLIGHT: local alias for reading existing targets
type ActiveIncomeTarget = Partial<CreateIncomeTargetPayload>; // HIGHLIGHT

// HIGHLIGHT: base conversion factors
const WEEKS_IN_MONTH = 4;
const WEEKS_IN_QUARTER = 13;
const WEEKS_IN_YEAR = 52;

type PeriodKey = "week" | "month" | "quarter" | "year";

interface SetTargetsProps {
  fleetSize: number;
  employeeCount: number;
}

// HIGHLIGHT: small helper for mapping periods
const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: "Weekly",
  month: "Monthly",
  quarter: "Quarterly",
  year: "Yearly",
};

export default function SetTargets({
  fleetSize,
  employeeCount,
}: SetTargetsProps): React.JSX.Element {
  // HIGHLIGHT: navigation hook
  const navigate = useNavigate(); // HIGHLIGHT

  // HIGHLIGHT: guards – never divide by 0
  const safeFleetSize = Math.max(fleetSize || 0, 1);
  const safeEmployeeCount = Math.max(employeeCount || 0, 1);

  // ==========================
  // CANONICAL STATE
  // ==========================
  const [weeklyIncomeTarget, setWeeklyIncomeTarget] = useState<number>(300);

  // HIGHLIGHT: expense % shared across periods for now
  const [serviceExpensePercentage, setServiceExpensePercentage] =
    useState<number>(10);
  const [employeeExpensePercentage, setEmployeeExpensePercentage] =
    useState<number>(20);
  const [totalExpensePercentage, setTotalExpensePercentage] =
    useState<number>(40);

  // HIGHLIGHT: optional absolute fuel targets anchored to weekly
  const [weeklyFuelCostTarget, setWeeklyFuelCostTarget] = useState<number>(80);

  // HIGHLIGHT: simple local submit state
  const [isSubmitting, setIsSubmitting] = useState(false); // HIGHLIGHT

  // ==========================
  // HIGHLIGHT: APPLY EXISTING TARGET TO STATE
  // ==========================
  function applyTargetToState(activeTarget: ActiveIncomeTarget) { // HIGHLIGHT
    // ---- income ----
    let nextWeeklyIncome = weeklyIncomeTarget;

    // HIGHLIGHT: allow 0 income targets as explicit values (>= 0)
    if (
      typeof activeTarget.weeklyCompanyIncomeTarget === "number" &&
      Number.isFinite(activeTarget.weeklyCompanyIncomeTarget) && // HIGHLIGHT
      activeTarget.weeklyCompanyIncomeTarget >= 0 // HIGHLIGHT
    ) {
      nextWeeklyIncome = activeTarget.weeklyCompanyIncomeTarget;
    } else if (
      typeof activeTarget.monthlyCompanyIncomeTarget === "number" &&
      Number.isFinite(activeTarget.monthlyCompanyIncomeTarget) && // HIGHLIGHT
      activeTarget.monthlyCompanyIncomeTarget >= 0 // HIGHLIGHT
    ) {
      nextWeeklyIncome =
        activeTarget.monthlyCompanyIncomeTarget / WEEKS_IN_MONTH;
    } else if (
      typeof activeTarget.quarterlyCompanyIncomeTarget === "number" &&
      Number.isFinite(activeTarget.quarterlyCompanyIncomeTarget) && // HIGHLIGHT
      activeTarget.quarterlyCompanyIncomeTarget >= 0 // HIGHLIGHT
    ) {
      nextWeeklyIncome =
        activeTarget.quarterlyCompanyIncomeTarget / WEEKS_IN_QUARTER;
    } else if (
      typeof activeTarget.yearlyCompanyIncomeTarget === "number" &&
      Number.isFinite(activeTarget.yearlyCompanyIncomeTarget) && // HIGHLIGHT
      activeTarget.yearlyCompanyIncomeTarget >= 0 // HIGHLIGHT
    ) {
      nextWeeklyIncome =
        activeTarget.yearlyCompanyIncomeTarget / WEEKS_IN_YEAR;
    }

    setWeeklyIncomeTarget(Number(nextWeeklyIncome.toFixed(2)));

    // ---- fuel ----
    let nextWeeklyFuel = weeklyFuelCostTarget;

    // HIGHLIGHT: allow 0 as a valid, explicit "no fuel tracking" value
    if (activeTarget.fuelCostsWeeklyTarget !== undefined) { // HIGHLIGHT
      const numeric = Number(activeTarget.fuelCostsWeeklyTarget); // HIGHLIGHT
      if (Number.isFinite(numeric) && numeric >= 0) { // HIGHLIGHT
        nextWeeklyFuel = numeric; // HIGHLIGHT
      } // HIGHLIGHT
    } else if (activeTarget.fuelCostsDailyTarget !== undefined) { // HIGHLIGHT
      const numeric = Number(activeTarget.fuelCostsDailyTarget); // HIGHLIGHT
      if (Number.isFinite(numeric) && numeric >= 0) { // HIGHLIGHT
        nextWeeklyFuel = numeric * 7; // HIGHLIGHT
      } // HIGHLIGHT
    } else if (activeTarget.fuelCostsMonthlyTarget !== undefined) { // HIGHLIGHT
      const numeric = Number(activeTarget.fuelCostsMonthlyTarget); // HIGHLIGHT
      if (Number.isFinite(numeric) && numeric >= 0) { // HIGHLIGHT
        nextWeeklyFuel = numeric / WEEKS_IN_MONTH; // HIGHLIGHT
      } // HIGHLIGHT
    } else if (activeTarget.fuelCostsQuarterlyTarget !== undefined) { // HIGHLIGHT
      const numeric = Number(activeTarget.fuelCostsQuarterlyTarget); // HIGHLIGHT
      if (Number.isFinite(numeric) && numeric >= 0) { // HIGHLIGHT
        nextWeeklyFuel = numeric / WEEKS_IN_QUARTER; // HIGHLIGHT
      } // HIGHLIGHT
    } else if (activeTarget.fuelCostsYearlyTarget !== undefined) { // HIGHLIGHT
      const numeric = Number(activeTarget.fuelCostsYearlyTarget); // HIGHLIGHT
      if (Number.isFinite(numeric) && numeric >= 0) { // HIGHLIGHT
        nextWeeklyFuel = numeric / WEEKS_IN_YEAR; // HIGHLIGHT
      } // HIGHLIGHT
    }

    setWeeklyFuelCostTarget(Number(nextWeeklyFuel.toFixed(2))); // HIGHLIGHT

    // ---- percentages ----
    if (
      typeof activeTarget.serviceExpensesPercentageTarget === "number"
    ) {
      setServiceExpensePercentage(
        activeTarget.serviceExpensesPercentageTarget
      );
    }

    if (
      typeof activeTarget.employeeExpensesPercentageTarget === "number"
    ) {
      setEmployeeExpensePercentage(
        activeTarget.employeeExpensesPercentageTarget
      );
    }

    if (
      typeof activeTarget.totalExpensesPercentageTarget === "number"
    ) {
      setTotalExpensePercentage(
        activeTarget.totalExpensesPercentageTarget
      );
    }
  } // HIGHLIGHT

  // ==========================
  // HIGHLIGHT: LOAD EXISTING TARGETS ON MOUNT
  // ==========================
  useEffect(() => { // HIGHLIGHT
    let isMounted = true;

    async function fetchActiveTargets() {
      try {
        const activeTarget = (await getActiveTargets()) as
          | ActiveIncomeTarget
          | null;
        if (!isMounted || !activeTarget) return;
        applyTargetToState(activeTarget);
      } catch (error) {
        // keep defaults if fetch fails
        console.error("Failed to load active company targets", error);
      }
    }

    fetchActiveTargets();

    return () => {
      isMounted = false;
    };
  }, []); // HIGHLIGHT

  // ==========================
  // DERIVED INCOME TARGETS
  // ==========================
  const incomeByPeriod = useMemo(() => {
    const week = weeklyIncomeTarget;
    const month = week * WEEKS_IN_MONTH;
    const quarter = week * WEEKS_IN_QUARTER;
    const year = week * WEEKS_IN_YEAR;
    return { week, month, quarter, year };
  }, [weeklyIncomeTarget]);

  const fuelByPeriod = useMemo(() => {
    const week = weeklyFuelCostTarget;
    const month = week * WEEKS_IN_MONTH;
    const quarter = week * WEEKS_IN_QUARTER;
    const year = week * WEEKS_IN_YEAR;
    return { week, month, quarter, year };
  }, [weeklyFuelCostTarget]);

  // HIGHLIGHT: per-vehicle weekly income target
  const perVehicleWeeklyIncome = useMemo(
    () => incomeByPeriod.week / safeFleetSize,
    [incomeByPeriod.week, safeFleetSize]
  );

  // ==========================
  // HANDLERS
  // ==========================
  function handleIncomeChange(period: PeriodKey, value: number) {
    if (!Number.isFinite(value) || value < 0) return;

    let newWeekly = incomeByPeriod.week;

    switch (period) {
      case "week":
        newWeekly = value;
        break;
      case "month":
        newWeekly = value / WEEKS_IN_MONTH;
        break;
      case "quarter":
        newWeekly = value / WEEKS_IN_QUARTER;
        break;
      case "year":
        newWeekly = value / WEEKS_IN_YEAR;
        break;
    }

    setWeeklyIncomeTarget(Number(newWeekly.toFixed(2)));
  }

  function handleFuelChange(period: PeriodKey, value: number) {
    if (!Number.isFinite(value) || value < 0) return;

    let newWeekly = weeklyFuelCostTarget;

    switch (period) {
      case "week":
        newWeekly = value;
        break;
      case "month":
        newWeekly = value / WEEKS_IN_MONTH;
        break;
      case "quarter":
        newWeekly = value / WEEKS_IN_QUARTER;
        break;
      case "year":
        newWeekly = value / WEEKS_IN_YEAR;
        break;
    }

    setWeeklyFuelCostTarget(Number(newWeekly.toFixed(2)));
  }

  // ==========================
  // PREVIEW – focus on weekly
  // ==========================
  const weeklyIncome = incomeByPeriod.week;
  const weeklyServiceExpense =
    (serviceExpensePercentage / 100) * weeklyIncome;
  const weeklyEmployeeExpense =
    (employeeExpensePercentage / 100) * weeklyIncome;
  // HIGHLIGHT: totalExpensePercentage is “cap” – not recalculated from others
  const weeklyTotalExpenseCap =
    (totalExpensePercentage / 100) * weeklyIncome;

  const rawExpensesSum =
    weeklyFuelCostTarget + weeklyServiceExpense + weeklyEmployeeExpense;
  const weeklyProfitApprox = weeklyIncome - rawExpensesSum;

  const expenseRatio =
    weeklyIncome > 0 ? Math.min(rawExpensesSum / weeklyIncome, 1) : 0;
  const profitRatio =
    weeklyIncome > 0 ? Math.max(weeklyProfitApprox / weeklyIncome, 0) : 0;

  // clamp for UI
  const safeExpenseRatio = Math.max(0, Math.min(expenseRatio, 1));
  const safeProfitRatio = Math.max(0, Math.min(profitRatio, 1));

  // ==========================
  // HIGHLIGHT: BUILD PAYLOAD
  // ==========================
  function buildTargetPayload(): CreateIncomeTargetPayload { // HIGHLIGHT
    const now = new Date();
    const oneYearLater = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate()
    );

    const dailyFuel = weeklyFuelCostTarget / 7;

    return {
      weeklyCompanyIncomeTarget: Number(weeklyIncome.toFixed(2)),
      monthlyCompanyIncomeTarget: Number(
        incomeByPeriod.month.toFixed(2)
      ),
      quarterlyCompanyIncomeTarget: Number(
        incomeByPeriod.quarter.toFixed(2)
      ),
      yearlyCompanyIncomeTarget: Number(
        incomeByPeriod.year.toFixed(2)
      ),

      fuelCostsDailyTarget: Number(dailyFuel.toFixed(2)),
      fuelCostsWeeklyTarget: Number(
        fuelByPeriod.week.toFixed(2)
      ),
      fuelCostsTripTarget: 0, // can refine later
      fuelCostsMonthlyTarget: Number(
        fuelByPeriod.month.toFixed(2)
      ),
      fuelCostsQuarterlyTarget: Number(
        fuelByPeriod.quarter.toFixed(2)
      ),
      fuelCostsYearlyTarget: Number(
        fuelByPeriod.year.toFixed(2)
      ),

      fleetTarget: safeFleetSize,
      numberOfVehiclesInOperationAtAnyGivenMoment: safeFleetSize,

      serviceExpensesPercentageTarget: serviceExpensePercentage,
      totalExpensesPercentageTarget: totalExpensePercentage,
      employeeExpensesPercentageTarget: employeeExpensePercentage,

      validTill: oneYearLater.toISOString().slice(0, 10),
    };
  }

  // ==========================
  // HIGHLIGHT: FORM SUBMIT
  // ==========================
  function handleSubmit(event: React.FormEvent) { // HIGHLIGHT
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const targetDraft = buildTargetPayload();

    // HIGHLIGHT: push to preview route with draft + meta
    navigate("/app/onboarding/preview-targets", {
      state: {
        targetDraft,
        fleetSize: safeFleetSize,
        employeeCount: safeEmployeeCount,
      },
    });

    setIsSubmitting(false);
  }

  return (
    // HIGHLIGHT: wrap in form and wire submit
    <form
      onSubmit={handleSubmit} // HIGHLIGHT
      className="max-w-6xl mx-auto px-6 lg:px-10 py-8 space-y-8"
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Set company targets
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Adjust one number and watch the entire picture update. All targets
          are anchored to your weekly income goal and fleet size.
        </p>
        <p className="text-xs text-slate-500">
          Fleet size: {safeFleetSize} vehicles · Employees:{" "}
          {safeEmployeeCount}
        </p>
      </div>

      {/* ================= LEFT: INPUTS ================= */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          {/* HIGHLIGHT: Income targets */}
          <section className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Income targets
            </h2>

            <p className="text-xs text-slate-500 mb-3">
              Change any period. The system recalculates week, month,
              quarter and year from that change.
            </p>

            <div className="space-y-3">
              {(["week", "month", "quarter", "year"] as PeriodKey[]).map(
                (periodKey) => {
                  const value = incomeByPeriod[periodKey];
                  return (
                    <div
                      key={periodKey}
                      className="flex items
justify-between gap-3"
                    >
                      <label className="text-xs text-slate-600 min-w-[80px]">
                        {PERIOD_LABELS[periodKey]}
                      </label>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          USD
                        </span>
                        <input
                          type="number"
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                          value={Number.isFinite(value) ? value : ""}
                          onChange={(event) =>
                            handleIncomeChange(
                              periodKey,
                              Number(event.target.value || 0)
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-600">
                Weekly per vehicle target:{" "}
                <span className="font-semibold">
                  {perVehicleWeeklyIncome.toFixed(2)} USD
                </span>
              </p>
            </div>
          </section>

          {/* HIGHLIGHT: Fuel + % expenses */}
          <section className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Expenses targets
            </h2>

            {/* Fuel absolute targets */}
            <div>
              <p className="text-xs text-slate-500 mb-2">
                Fuel cost targets (absolute). Edit any period; others
                follow.
              </p>
              <div className="space-y-2">
                {(["week", "month", "quarter", "year"] as PeriodKey[]).map(
                  (periodKey) => {
                    const value = fuelByPeriod[periodKey];
                    return (
                      <div
                        key={periodKey}
                        className="flex items-center justify-between gap-3"
                      >
                        <label className="text-xs text-slate-600 min-w-[80px]">
                          {PERIOD_LABELS[periodKey]}
                        </label>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            USD
                          </span>
                          <input
                            type="number"
                            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                            value={Number.isFinite(value) ? value : ""}
                            onChange={(event) =>
                              handleFuelChange(
                                periodKey,
                                Number(event.target.value || 0)
                              )
                            }
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Percentages */}
            <div className="border-t border-slate-200 pt-3 space-y-3">
              <PercentageSliderRow
                label="Service expenses % of income"
                value={serviceExpensePercentage}
                onChange={setServiceExpensePercentage}
              />
              <PercentageSliderRow
                label="Employee expenses % of income"
                value={employeeExpensePercentage}
                onChange={setEmployeeExpensePercentage}
              />
              <PercentageSliderRow
                label="Total expenses cap % of income"
                value={totalExpensePercentage}
                onChange={setTotalExpensePercentage}
              />
            </div>
          </section>
        </div>

        {/* ================= RIGHT: LIVE PREVIEW ================= */}
        <div className="space-y-4">
          <section className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-slate-50 shadow-lg">
            <h2 className="text-sm font-semibold mb-2">
              Weekly snapshot preview
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              This is how your weekly target breaks down with the current
              settings.
            </p>

            {/* Income vs expenses headline numbers */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="rounded-xl bg-slate-800/70 p-3">
                <p className="text-slate-400 mb-1">Weekly income target</p>
                <p className="text-sm font-semibold">
                  {weeklyIncome.toFixed(2)} USD
                </p>
              </div>
              <div className="rounded-xl bg-slate-800/70 p-3">
                <p className="text-slate-400 mb-1">
                  Approx. weekly profit
                </p>
                <p className="text-sm font-semibold">
                  {weeklyProfitApprox.toFixed(2)} USD
                </p>
              </div>
            </div>

            {/* HIGHLIGHT: bar visual */}
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

            {/* Breakdown rows */}
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
                Employees: {safeEmployeeCount} · Rough income per employee:{" "}
                <span className="font-semibold text-slate-100">
                  {(weeklyIncome / safeEmployeeCount).toFixed(2)} USD
                </span>
              </p>
            </div>
          </section>

          {/* HIGHLIGHT: primary submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              Review targets
            </button>
          </div>
          {/* END HIGHLIGHT */}
        </div>
      </div>
    </form>
  );
}

// =========================
// HIGHLIGHT: helper rows
// =========================

interface PercentageSliderRowProps {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
}

function PercentageSliderRow({
  label,
  value,
  onChange,
}: PercentageSliderRowProps): React.JSX.Element {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">{value.toFixed(1)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
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