// HIGHLIGHT: new controller for company targets

import { Request, Response } from "express";
const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";
import { CompanyTargets, CompanyDoc } from "../types/index";
import { requireCompanyContext } from "../utils/companyContext";

const companiesRef = db.collection("companies");

export const getActiveTargets = async (req: Request, res: Response) => {
  // HIGHLIGHT
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  try {
    const targetsRef = companiesRef.doc(companyId).collection("targets");
    const snap = await targetsRef
      .where("isActive", "==", true)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(200).json(success(null));
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data() as Omit<CompanyTargets, "id">;

    return res.status(200).json(success({ id: docSnap.id, ...data }));
  } catch (error: any) {
    console.error("Error fetching active targets:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to fetch active targets",
          error.message
        )
      );
  }
};

export const createTargets = async (req: Request, res: Response) => {
  // HIGHLIGHT
  const ctx = await requireCompanyContext(req, res);
  if (!ctx) return;
  const { companyId } = ctx;

  const {
    incomeTargets,
    fuelTargets,
    expenseTargets,
    fleetTarget,
  } = req.body;

  if (!incomeTargets || !expenseTargets) {
    return res.status(400).json(
      failure("VALIDATION_ERROR", "incomeTargets and expenseTargets are required", {
        incomeTargets,
        expenseTargets,
      })
    );
  }

  try {
    const companyRef = companiesRef.doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return res
        .status(404)
        .json(failure("NOT_FOUND", "Company not found", { companyId }));
    }

    const company = companySnap.data() as CompanyDoc;
    const now = admin.firestore.Timestamp.now();

    const targetRef = companyRef.collection("targets").doc();

    // HIGHLIGHT: deactivate previous active targets
    const activeSnap = await companyRef
      .collection("targets")
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();
    activeSnap.docs.forEach((d: any) => {
      batch.update(d.ref, {
        isActive: false,
        updatedAt: now,
      });
    });

    const payload: Omit<CompanyTargets, "id"> = {
      companyId,
      createdAt: now,
      updatedAt: now,
      effectiveFrom: now,
      validTill: null,
      isActive: true,
      incomeTargets: {
        weeklyCompanyIncomeTarget: Number(
          incomeTargets.weeklyCompanyIncomeTarget ?? 0
        ),
        monthlyCompanyIncomeTarget: Number(
          incomeTargets.monthlyCompanyIncomeTarget ?? 0
        ),
        quarterlyCompanyIncomeTarget: Number(
          incomeTargets.quarterlyCompanyIncomeTarget ?? 0
        ),
        yearlyIncomeTarget: Number(incomeTargets.yearlyIncomeTarget ?? 0),
      },
      fuelTargets: {
        fuelCostsDailyTarget: Number(fuelTargets?.fuelCostsDailyTarget ?? 0),
        fuelCostsWeeklyTarget: Number(fuelTargets?.fuelCostsWeeklyTarget ?? 0),
        fuelCostsTripTarget: Number(fuelTargets?.fuelCostsTripTarget ?? 0),
        fuelCostsMonthlyTarget: Number(fuelTargets?.fuelCostsMonthlyTarget ?? 0),
        fuelCostsQuarterlyTarget: Number(
          fuelTargets?.fuelCostsQuarterlyTarget ?? 0
        ),
        fuelCostsYearlyTarget: Number(fuelTargets?.fuelCostsYearlyTarget ?? 0),
      },
      expenseTargets: {
        serviceExpensesAsPercentage: Number(
          expenseTargets.serviceExpensesAsPercentage ?? 0
        ),
        totalExpenseAsPercentage: Number(
          expenseTargets.totalExpenseAsPercentage ?? 0
        ),
        employeeExpensePercentage: Number(
          expenseTargets.employeeExpensePercentage ?? 0
        ),
      },
      fleetTarget: {
        numberOfVehiclesInOperationAtAnyGivenMoment: Number(
          fleetTarget?.numberOfVehiclesInOperationAtAnyGivenMoment ??
            company.fleetSize
        ),
      },
      metaSnapshot: {
        fleetSize: company.fleetSize,
        employeeCount: company.employeeCount,
      },
    };

    batch.set(targetRef, payload);

    await batch.commit();

    return res
      .status(201)
      .json(success({ id: targetRef.id, ...payload }));
  } catch (error: any) {
    console.error("Error creating targets:", error);
    return res
      .status(500)
      .json(
        failure(
          "SERVER_ERROR",
          "Failed to create targets",
          error.message
        )
      );
  }
};