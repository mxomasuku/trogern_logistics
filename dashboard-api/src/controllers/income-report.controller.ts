// src/controllers/income-report.controller.ts
import { Request, Response } from "express";
import PDFDocument from "pdfkit";

const { db, admin } = require("../config/firebase");
import { success, failure } from "../utils/apiResponse";

/**
 * Collections
 */
const incomeCollection: FirebaseFirestore.CollectionReference =
    db.collection("income");

/**
 * Types
 */
interface IncomeRecord {
    id: string;
    companyId: string;
    amount: number;
    type: "income" | "expense";
    vehicle: string;
    driverId: string;
    driverName: string;
    note?: string;
    cashDate: FirebaseFirestore.Timestamp;
    createdAt: FirebaseFirestore.Timestamp;
}

interface MonthData {
    month: string; // "2025-04"
    displayMonth: string; // "April 2025"
    records: IncomeRecord[];
    grossIncome: number;
    totalExpenses: number;
    netIncome: number;
}

/* ------------------------------------------------------------------ */
/* AUTH + COMPANY CONTEXT                                             */
/* ------------------------------------------------------------------ */

async function getUidFromSession(
    req: Request,
    res: Response
): Promise<string | null> {
    const cookie = req.cookies?.session;
    if (!cookie) {
        res.status(401).json(failure("UNAUTHORIZED", "No session cookie found"));
        return null;
    }

    const checkRevoked =
        process.env.NODE_ENV === "production" &&
        !process.env.FIREBASE_AUTH_EMULATOR_HOST;

    try {
        const decoded = await admin.auth().verifySessionCookie(cookie, checkRevoked);
        return decoded.uid as string;
    } catch {
        res.status(401).json(failure("UNAUTHORIZED", "Unauthorized or expired session"));
        return null;
    }
}

async function getCompanyContext(
    req: Request,
    res: Response
): Promise<{ uid: string; companyId: string; companyName?: string } | null> {
    const uid = await getUidFromSession(req, res);
    if (!uid) return null;

    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data() as { companyId?: string } | undefined;

    if (!userData?.companyId) {
        res.status(403).json(
            failure(
                "NO_COMPANY",
                "No company configured for this user. Complete company onboarding first."
            )
        );
        return null;
    }

    // Try to get company name
    let companyName = "Company";
    try {
        const companySnap = await db.collection("companies").doc(userData.companyId).get();
        if (companySnap.exists) {
            const companyData = companySnap.data() as { name?: string };
            companyName = companyData?.name || "Company";
        }
    } catch {
        // Use default
    }

    return { uid, companyId: userData.companyId, companyName };
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

function formatDate(ts: FirebaseFirestore.Timestamp): string {
    const date = ts.toDate();
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
}

function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
}

function getDisplayMonth(monthKey: string): string {
    const [year, month] = monthKey.split("-");
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} ${year}`;
}

function generateMonthsBetween(start: Date, end: Date): string[] {
    const months: string[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
        months.push(getMonthKey(current));
        current.setMonth(current.getMonth() + 1);
    }

    return months;
}

/* ------------------------------------------------------------------ */
/* MAIN CONTROLLER                                                    */
/* ------------------------------------------------------------------ */

export async function getIncomeStatement(
    req: Request,
    res: Response
): Promise<Response | void> {
    try {
        // Authenticate and get company context
        const ctx = await getCompanyContext(req, res);
        if (!ctx) return;
        const { companyId, companyName } = ctx;

        // Find date range
        const oldestSnap = await incomeCollection
            .where("companyId", "==", companyId)
            .orderBy("cashDate", "asc")
            .limit(1)
            .get();

        if (oldestSnap.empty) {
            return res.status(404).json(
                failure("NO_DATA", "No income records found for this company")
            );
        }

        const oldestRecord = oldestSnap.docs[0].data() as IncomeRecord;
        const oldestDate = oldestRecord.cashDate.toDate();
        const now = new Date();

        // Generate month buckets
        const monthKeys = generateMonthsBetween(oldestDate, now);

        // Fetch all income records
        const allRecordsSnap = await incomeCollection
            .where("companyId", "==", companyId)
            .orderBy("cashDate", "asc")
            .get();

        const allRecords: IncomeRecord[] = allRecordsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as IncomeRecord));

        // Group by month
        const monthDataMap = new Map<string, MonthData>();

        for (const monthKey of monthKeys) {
            monthDataMap.set(monthKey, {
                month: monthKey,
                displayMonth: getDisplayMonth(monthKey),
                records: [],
                grossIncome: 0,
                totalExpenses: 0,
                netIncome: 0,
            });
        }

        for (const record of allRecords) {
            const monthKey = getMonthKey(record.cashDate.toDate());
            const monthData = monthDataMap.get(monthKey);
            if (monthData) {
                monthData.records.push(record);
                if (record.type === "income") {
                    monthData.grossIncome += Math.abs(record.amount);
                } else {
                    monthData.totalExpenses += Math.abs(record.amount);
                }
            }
        }

        // Calculate net income for each month
        for (const monthData of monthDataMap.values()) {
            monthData.netIncome = monthData.grossIncome - monthData.totalExpenses;
        }

        // Calculate grand totals
        let grandGrossIncome = 0;
        let grandTotalExpenses = 0;

        for (const monthData of monthDataMap.values()) {
            grandGrossIncome += monthData.grossIncome;
            grandTotalExpenses += monthData.totalExpenses;
        }

        const grandNetIncome = grandGrossIncome - grandTotalExpenses;

        // Generate PDF
        const doc = new PDFDocument({ margin: 50, size: "A4" });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="income-statement-${companyId}.pdf"`
        );

        // Pipe to response
        doc.pipe(res);

        // Header
        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text(`${companyName} - Income Statement`, { align: "center" });

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, { align: "center" });

        doc.moveDown(1.5);

        const pageWidth = doc.page.width - 100; // 50 margin on each side
        const colWidths = {
            date: 60,
            description: pageWidth - 180,
            debit: 60,
            credit: 60,
        };

        // Process each month
        for (const monthData of Array.from(monthDataMap.values())) {
            // Skip months with no records
            if (monthData.records.length === 0) continue;

            // Check if we need a new page
            if (doc.y > doc.page.height - 200) {
                doc.addPage();
            }

            // Month header
            doc
                .fontSize(14)
                .font("Helvetica-Bold")
                .text(`---------- ${monthData.displayMonth} ----------`, { align: "left" });

            doc.moveDown(0.5);

            // Table header
            const tableTop = doc.y;
            doc.fontSize(9).font("Helvetica-Bold");

            doc.text("Date", 50, tableTop, { width: colWidths.date });
            doc.text("Description", 50 + colWidths.date, tableTop, { width: colWidths.description });
            doc.text("Debit", 50 + colWidths.date + colWidths.description, tableTop, { width: colWidths.debit, align: "right" });
            doc.text("Credit", 50 + colWidths.date + colWidths.description + colWidths.debit, tableTop, { width: colWidths.credit, align: "right" });

            doc.moveDown(0.3);
            doc
                .moveTo(50, doc.y)
                .lineTo(50 + pageWidth, doc.y)
                .stroke();

            doc.moveDown(0.3);

            // Records
            doc.font("Helvetica").fontSize(8);

            for (const record of monthData.records) {
                // Check if we need a new page
                if (doc.y > doc.page.height - 100) {
                    doc.addPage();
                    doc.moveDown(0.5);
                }

                const rowY = doc.y;
                const dateStr = formatDate(record.cashDate);
                const description = `${record.vehicle} - ${record.driverName}${record.note ? ` - ${record.note}` : ""}`;
                const debit = record.type === "expense" ? formatCurrency(Math.abs(record.amount)) : "-";
                const credit = record.type === "income" ? formatCurrency(Math.abs(record.amount)) : "-";

                doc.text(dateStr, 50, rowY, { width: colWidths.date });
                doc.text(description.substring(0, 50), 50 + colWidths.date, rowY, { width: colWidths.description });
                doc.text(debit, 50 + colWidths.date + colWidths.description, rowY, { width: colWidths.debit, align: "right" });
                doc.text(credit, 50 + colWidths.date + colWidths.description + colWidths.debit, rowY, { width: colWidths.credit, align: "right" });

                doc.moveDown(0.4);
            }

            // Month totals
            doc.moveDown(0.3);
            doc
                .moveTo(50, doc.y)
                .lineTo(50 + pageWidth, doc.y)
                .stroke();

            doc.moveDown(0.5);
            doc.font("Helvetica-Bold").fontSize(9);

            doc.text(`Month Totals:`, 50);
            doc.moveDown(0.3);
            doc.font("Helvetica").fontSize(9);
            doc.text(`  Gross Income:     ${formatCurrency(monthData.grossIncome)}`, 50);
            doc.text(`  Total Expenses:   ${formatCurrency(monthData.totalExpenses)}`, 50);
            doc.font("Helvetica-Bold");
            doc.text(`  Net Income:       ${formatCurrency(monthData.netIncome)}`, 50);

            doc.moveDown(1.5);
        }

        // Grand totals
        doc.addPage();

        doc
            .fontSize(16)
            .font("Helvetica-Bold")
            .text("GRAND TOTALS (All Time)", { align: "center" });

        doc.moveDown(1);

        doc
            .moveTo(50, doc.y)
            .lineTo(50 + pageWidth, doc.y)
            .stroke();

        doc.moveDown(0.5);

        doc.fontSize(12).font("Helvetica");
        doc.text(`Gross Income:     ${formatCurrency(grandGrossIncome)}`, 100);
        doc.text(`Total Expenses:   ${formatCurrency(grandTotalExpenses)}`, 100);
        doc.moveDown(0.5);
        doc.font("Helvetica-Bold").fontSize(14);
        doc.text(`Net Income:       ${formatCurrency(grandNetIncome)}`, 100);

        doc.moveDown(1);
        doc
            .moveTo(50, doc.y)
            .lineTo(50 + pageWidth, doc.y)
            .stroke();

        // Finalize PDF
        doc.end();
    } catch (error: any) {
        console.error("Error generating income statement:", error);
        // Only send error if headers not already sent
        if (!res.headersSent) {
            return res
                .status(500)
                .json(
                    failure(
                        "SERVER_ERROR",
                        "Failed to generate income statement",
                        error?.message ?? String(error)
                    )
                );
        }
    }
}
