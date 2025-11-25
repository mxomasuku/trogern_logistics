// src/pages/onboarding/SetTargets.tsx
import React, { useEffect, useMemo, useState } from "react"; // HIGHLIGHT
import { useNavigate } from "react-router-dom"; // HIGHLIGHT
import type { CreateIncomeTargetPayload } from "@/api/targets"; // HIGHLIGHT
import { getActiveTargets } from "@/api/targets"; // HIGHLIGHT
import { updateCompanyCoreDetails } from "@/api/company"; // HIGHLIGHT
import { getMyCompanyDetails } from "@/api/company"; // HIGHLIGHT
import { PageHeader } from "../../../layouts/HomeLayout/Components/PageHeader"; // HIGHLIGHT
import { Button } from "@/components/ui/button"; // HIGHLIGHT
import { ArrowLeft } from "lucide-react"; // HIGHLIGHT

// HIGHLIGHT: base conversion factors
const WEEKS_IN_MONTH = 4;
const WEEKS_IN_QUARTER = 13;
const WEEKS_IN_YEAR = 52;

type PeriodKey = "week" | "month" | "quarter" | "year";

// HIGHLIGHT: period labels
const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: "Weekly",
  month: "Monthly",
  quarter: "Quarterly",
  year: "Yearly",
};

// HIGHLIGHT: local alias for reading existing targets
type ActiveIncomeTarget = Partial<CreateIncomeTargetPayload>; // HIGHLIGHT

export default function SetTargets(): React.JSX.Element {
  const navigate = useNavigate();

  // HIGHLIGHT: local fleet + employee counts (no props)
  const [fleetSize, setFleetSize] = useState<number>(1); // HIGHLIGHT
  const [employeeCount, setEmployeeCount] = useState<number>(1); // HIGHLIGHT

  // HIGHLIGHT: modal state for fleet + employee editing
  const [isFleetModalOpen, setIsFleetModalOpen] = useState<boolean>(false); // HIGHLIGHT
  const [fleetSizeDraft, setFleetSizeDraft] = useState<number>(fleetSize); // HIGHLIGHT
  const [employeeCountDraft, setEmployeeCountDraft] =
    useState<number>(employeeCount); // HIGHLIGHT
  const [isUpdatingCompanyDetails, setIsUpdatingCompanyDetails] =
    useState<boolean>(false); // HIGHLIGHT

  // HIGHLIGHT (EDITED): guards – never divide by 0, used everywhere including payload + preview
  const safeFleetSize = Math.max(fleetSize || 0, 1); // HIGHLIGHT (EDITED)
  const safeEmployeeCount = Math.max(employeeCount || 0, 1); // HIGHLIGHT (EDITED)

  // ==========================
  // CANONICAL STATE
  // ==========================
  const [weeklyIncomeTarget, setWeeklyIncomeTarget] =
    useState<number>(300);

  const [serviceExpensePercentage, setServiceExpensePercentage] =
    useState<number>(10);
  const [employeeExpensePercentage, setEmployeeExpensePercentage] =
    useState<number>(20);
  const [totalExpensePercentage, setTotalExpensePercentage] =
    useState<number>(40);

  const [weeklyFuelCostTarget, setWeeklyFuelCostTarget] =
    useState<number>(80);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================
  // APPLY EXISTING TARGET TO STATE
  // ==========================
  function applyTargetToState(activeTarget: ActiveIncomeTarget) {
    // ---- income ----
    let nextWeeklyIncome = weeklyIncomeTarget;

    if (
      typeof activeTarget.weeklyCompanyIncomeTarget === "number" &&
      Number.isFinite(activeTarget.weeklyCompanyIncomeTarget) &&
      activeTarget.weeklyCompanyIncomeTarget >= 0
    ) {
      nextWeeklyIncome = activeTarget.weeklyCompanyIncomeTarget;
    } else if (
      typeof activeTarget.monthlyCompanyIncomeTarget === "number" &&
      Number.isFinite(activeTarget.monthlyCompanyIncomeTarget) &&
      activeTarget.monthlyCompanyIncomeTarget >= 0
    ) {
      nextWeeklyIncome =
        activeTarget.monthlyCompanyIncomeTarget / WEEKS_IN_MONTH;
    } else if (
      typeof activeTarget.quarterlyCompanyIncomeTarget === "number" &&
      Number.isFinite(activeTarget.quarterlyCompanyIncomeTarget) &&
      activeTarget.quarterlyCompanyIncomeTarget >= 0
    ) {
      nextWeeklyIncome =
        activeTarget.quarterlyCompanyIncomeTarget / WEEKS_IN_QUARTER;
    } else if (
      typeof activeTarget.yearlyCompanyIncomeTarget === "number" &&
      Number.isFinite(activeTarget.yearlyCompanyIncomeTarget) &&
      activeTarget.yearlyCompanyIncomeTarget >= 0
    ) {
      nextWeeklyIncome =
        activeTarget.yearlyCompanyIncomeTarget / WEEKS_IN_YEAR;
    }

    setWeeklyIncomeTarget(Number(nextWeeklyIncome.toFixed(2)));

    // ---- fuel ----
    let nextWeeklyFuel = weeklyFuelCostTarget;

    if (activeTarget.fuelCostsWeeklyTarget !== undefined) {
      const numeric = Number(activeTarget.fuelCostsWeeklyTarget);
      if (Number.isFinite(numeric) && numeric >= 0) {
        nextWeeklyFuel = numeric;
      }
    } else if (activeTarget.fuelCostsDailyTarget !== undefined) {
      const numeric = Number(activeTarget.fuelCostsDailyTarget);
      if (Number.isFinite(numeric) && numeric >= 0) {
        nextWeeklyFuel = numeric * 7;
      }
    } else if (activeTarget.fuelCostsMonthlyTarget !== undefined) {
      const numeric = Number(activeTarget.fuelCostsMonthlyTarget);
      if (Number.isFinite(numeric) && numeric >= 0) {
        nextWeeklyFuel = numeric / WEEKS_IN_MONTH;
      }
    } else if (activeTarget.fuelCostsQuarterlyTarget !== undefined) {
      const numeric = Number(activeTarget.fuelCostsQuarterlyTarget);
      if (Number.isFinite(numeric) && numeric >= 0) {
        nextWeeklyFuel = numeric / WEEKS_IN_QUARTER;
      }
    } else if (activeTarget.fuelCostsYearlyTarget !== undefined) {
      const numeric = Number(activeTarget.fuelCostsYearlyTarget);
      if (Number.isFinite(numeric) && numeric >= 0) {
        nextWeeklyFuel = numeric / WEEKS_IN_YEAR;
      }
    }

    setWeeklyFuelCostTarget(Number(nextWeeklyFuel.toFixed(2)));

    // ---- percentages ----
    if (
      typeof activeTarget.serviceExpensesPercentageTarget === "number"
    ) {
      setServiceExpensePercentage(
        activeTarget.serviceExpensesPercentageTarget,
      );
    }

    if (
      typeof activeTarget.employeeExpensesPercentageTarget === "number"
    ) {
      setEmployeeExpensePercentage(
        activeTarget.employeeExpensesPercentageTarget,
      );
    }

    if (
      typeof activeTarget.totalExpensesPercentageTarget === "number"
    ) {
      setTotalExpensePercentage(
        activeTarget.totalExpensesPercentageTarget,
      );
    }
  }

  // ==========================
  // LOAD EXISTING TARGETS + COMPANY CORE DETAILS ON MOUNT
  // ==========================
  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      try {
        const company = await getMyCompanyDetails(); // HIGHLIGHT
        console.log("SetTargets:getMyCompanyDetails ->", company); // HIGHLIGHT

        if (isMounted && company) {
          const companyFleetSize = Number((company as any).fleetSize);
          if (Number.isFinite(companyFleetSize) && companyFleetSize > 0) {
            setFleetSize(companyFleetSize);
            setFleetSizeDraft(companyFleetSize);
          }

          const companyEmployeeCount = Number(
            (company as any).employeeCount,
          );
          if (
            Number.isFinite(companyEmployeeCount) &&
            companyEmployeeCount > 0
          ) {
            setEmployeeCount(companyEmployeeCount);
            setEmployeeCountDraft(companyEmployeeCount);
          }
        }

        const activeTarget = (await getActiveTargets()) as
          | ActiveIncomeTarget
          | null;
        if (!isMounted || !activeTarget) return;
        applyTargetToState(activeTarget);
      } catch (error) {
        console.error("Failed to load onboarding data", error);
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const perVehicleWeeklyIncome = useMemo(
    () => incomeByPeriod.week / safeFleetSize,
    [incomeByPeriod.week, safeFleetSize],
  );

  // HIGHLIGHT (ADDED): per-vehicle income by period, derived from weekly per vehicle
  const incomePerVehicleByPeriod = useMemo(() => {
    const week = perVehicleWeeklyIncome || 0;
    const month = week * WEEKS_IN_MONTH;
    const quarter = week * WEEKS_IN_QUARTER;
    const year = week * WEEKS_IN_YEAR;
    return { week, month, quarter, year };
  }, [perVehicleWeeklyIncome]);

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

  // HIGHLIGHT (ADDED): handler to set weekly income from per-vehicle weekly target
  function handlePerVehicleWeeklyChange(value: number) {
    if (!Number.isFinite(value) || value < 0) return;
    const newWeeklyCompanyIncome = value * safeFleetSize;
    setWeeklyIncomeTarget(Number(newWeeklyCompanyIncome.toFixed(2)));
  }

  // HIGHLIGHT: modal handlers for fleet + employee count
  function handleOpenFleetModal() {
    setFleetSizeDraft(fleetSize);
    setEmployeeCountDraft(employeeCount);
    setIsFleetModalOpen(true);
  }

  async function handleSaveCompanyCoreDetails() {
    const normalizedFleetSize =
      Number.isFinite(fleetSizeDraft) && fleetSizeDraft > 0
        ? Math.floor(fleetSizeDraft)
        : 1;

    const normalizedEmployeeCount =
      Number.isFinite(employeeCountDraft) && employeeCountDraft > 0
        ? Math.floor(employeeCountDraft)
        : 1;

    try {
      setIsUpdatingCompanyDetails(true);
      await updateCompanyCoreDetails({
        fleetSize: normalizedFleetSize,
        employeeCount: normalizedEmployeeCount,
      });

      setFleetSize(normalizedFleetSize);
      setEmployeeCount(normalizedEmployeeCount);
      setIsFleetModalOpen(false);

      window.location.reload();
    } catch (error) {
      console.error("Failed to update company core details", error);
    } finally {
      setIsUpdatingCompanyDetails(false);
    }
  }

  // ==========================
  // PREVIEW – focus on weekly
  // ==========================
  const weeklyIncome = incomeByPeriod.week;
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
  // BUILD PAYLOAD
  // ==========================
  function buildTargetPayload(): CreateIncomeTargetPayload {
    const now = new Date();
    const oneYearLater = new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate(),
    );

    const dailyFuel = weeklyFuelCostTarget / 7;

    return {
      weeklyCompanyIncomeTarget: Number(weeklyIncome.toFixed(2)),
      monthlyCompanyIncomeTarget: Number(
        incomeByPeriod.month.toFixed(2),
      ),
      quarterlyCompanyIncomeTarget: Number(
        incomeByPeriod.quarter.toFixed(2),
      ),
      yearlyCompanyIncomeTarget: Number(
        incomeByPeriod.year.toFixed(2),
      ),

      fuelCostsDailyTarget: Number(dailyFuel.toFixed(2)),
      fuelCostsWeeklyTarget: Number(fuelByPeriod.week.toFixed(2)),
      fuelCostsTripTarget: 0,
      fuelCostsMonthlyTarget: Number(
        fuelByPeriod.month.toFixed(2),
      ),
      fuelCostsQuarterlyTarget: Number(
        fuelByPeriod.quarter.toFixed(2),
      ),
      fuelCostsYearlyTarget: Number(
        fuelByPeriod.year.toFixed(2),
      ),

      fleetTarget: safeFleetSize,
      numberOfVehiclesInOperationAtAnyGivenMoment: safeFleetSize,
      amountEarnedPerVehicle: Number(
        incomePerVehicleByPeriod.week.toFixed(2),
      ),

      serviceExpensesPercentageTarget: serviceExpensePercentage,
      totalExpensesPercentageTarget: totalExpensePercentage,
      employeeExpensesPercentageTarget: employeeExpensePercentage,

      validTill: oneYearLater.toISOString().slice(0, 10),
    };
  }

  // ==========================
  // FORM SUBMIT
  // ==========================
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const targetDraft = buildTargetPayload();

    navigate("/app/onboarding/preview-targets", {
      state: {
        targetDraft,
        fleetSize: safeFleetSize,
        employeeCount: safeEmployeeCount,
      },
    });

    setIsSubmitting(false);
  }

  // ==========================
  // LAYOUT / ALIGNMENT (MOBILE-TUNED)
  // ==========================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* HIGHLIGHT (EDITED MOBILE): tighter X padding on small screens, same max width */}
      <div className="max-w-6xl mx-auto lg:px-6 py-4 space-y-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-blue-700 hover:bg-blue-50 hover:text-blue-800 px-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg">
          <form
            onSubmit={handleSubmit}
            className="px-3 sm:px-4 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8" // HIGHLIGHT (EDITED MOBILE)
          >
            <PageHeader
              titleMain="Set"
              titleAccent="Targets"
              enableSearch={false}
            />

            {/* HEADER */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                {/* HIGHLIGHT (EDITED MOBILE): column on mobile, row on sm+ */}
                <div>
                  <p className="text-xs text-slate-600 max-w-2xl">
                    Adjust one number and watch the entire picture update. All
                    targets are anchored to your weekly income goal and fleet size.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Fleet size: {safeFleetSize} vehicles · Employees:{" "}
                    {safeEmployeeCount}
                  </p>
                </div>

                <div className="sm:self-start">
                  <button
                    type="button"
                    onClick={handleOpenFleetModal}
                    className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* HIGHLIGHT (EDITED MOBILE): gap slightly smaller on mobile */}
            <div className="grid lg:grid-cols-2 gap-5 lg:gap-6 items-start">
              {/* LEFT: INPUTS */}
              <div className="space-y-5 sm:space-y-6">
                {/* Income targets */}
                <section className="border border-slate-200 rounded-2xl p-3 sm:p-4 bg-white shadow-sm"> {/* HIGHLIGHT (EDITED MOBILE) */}
                  <h2 className="text-sm font-semibold text-slate-800 mb-2 sm:mb-3">
                    Income targets
                  </h2>

                  <p className="text-xs text-slate-500 mb-2 sm:mb-3">
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
                            className="flex items justify-between gap-3"
                          >
                            <label className="text-xs text-slate-600 min-w-[72px] sm:min-w-[80px]">
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
                                    Number(event.target.value || 0),
                                  )
                                }
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* per vehicle target input + period breakdown */}
                  <div className="mt-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 px-3 py-3 space-y-2">
                    <p className="text-xs text-slate-600 mb-1">
                      Per vehicle income target (weekly)
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-400">USD</span>
                      <input
                        type="number"
                        className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        value={
                          Number.isFinite(incomePerVehicleByPeriod.week)
                            ? incomePerVehicleByPeriod.week
                            : ""
                        }
                        onChange={(event) =>
                          handlePerVehicleWeeklyChange(
                            Number(event.target.value || 0),
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Weekly</span>
                        <span className="font-semibold text-slate-800">
                          {incomePerVehicleByPeriod.week.toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monthly</span>
                        <span className="font-semibold text-slate-800">
                          {incomePerVehicleByPeriod.month.toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quarterly</span>
                        <span className="font-semibold text-slate-800">
                          {incomePerVehicleByPeriod.quarter.toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Yearly</span>
                        <span className="font-semibold text-slate-800">
                          {incomePerVehicleByPeriod.year.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Expenses */}
                <section className="border border-slate-200 rounded-2xl p-3 sm:p-4 bg-white shadow-sm space-y-4"> {/* HIGHLIGHT (EDITED MOBILE) */}
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
                              <label className="text-xs text-slate-600 min-w-[72px] sm:min-w-[80px]">
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
                                      Number(event.target.value || 0),
                                    )
                                  }
                                />
                              </div>
                            </div>
                          );
                        },
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

              {/* RIGHT: LIVE PREVIEW */}
              <div className="space-y-4">
                <section className="border border-slate-200 rounded-2xl p-3 sm:p-4 bg-slate-900 text-slate-50 shadow-lg"> {/* HIGHLIGHT (EDITED MOBILE) */}
                  <h2 className="text-sm font-semibold mb-2">
                    Weekly snapshot preview
                  </h2>
                  <p className="text-xs text-slate-300 mb-4">
                    This is how your weekly target breaks down with the current
                    settings.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4"> {/* HIGHLIGHT (EDITED MOBILE) */}
                    <div className="rounded-xl bg-slate-800/70 p-3">
                      <p className="text-slate-400 mb-1">
                        Weekly income target
                      </p>
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
                      Employees: {safeEmployeeCount} · Rough income per employee:{" "}
                      <span className="font-semibold text-slate-100">
                        {(weeklyIncome / safeEmployeeCount).toFixed(2)} USD
                      </span>
                    </p>
                  </div>
                </section>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                  >
                    Review targets
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* modal for editing fleet size + employee count */}
        {isFleetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-2xl bg-white p-4 sm:p-5 shadow-xl"> {/* HIGHLIGHT (EDITED MOBILE) */}
              <h2 className="text-sm font-semibold text-slate-900 mb-2">
                Edit fleet and staff
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Update the total number of vehicles and employees used for
                your company targets.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
                    Fleet size (vehicles)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={
                      Number.isFinite(fleetSizeDraft) ? fleetSizeDraft : ""
                    }
                    onChange={(event) =>
                      setFleetSizeDraft(Number(event.target.value || 0))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
                    Employees
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={
                      Number.isFinite(employeeCountDraft)
                        ? employeeCountDraft
                        : ""
                    }
                    onChange={(event) =>
                      setEmployeeCountDraft(Number(event.target.value || 0))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setIsFleetModalOpen(false)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  disabled={isUpdatingCompanyDetails}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompanyCoreDetails}
                  disabled={isUpdatingCompanyDetails}
                  className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {isUpdatingCompanyDetails ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================
// helper rows
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