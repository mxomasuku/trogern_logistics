export interface Trip {
    startTime: FirebaseFirestore.Timestamp,
    odometerReadingOnStart: number,
    odometerReadingOnEnd: number,
    endTime: FirebaseFirestore.Timestamp,
    distanceInKm: number,
    expectedEndTime: FirebaseFirestore.Timestamp,
    tollgates: number;
    expectedExpenses: number;
    fuelBudget: number;
    amountPaid: number;
    client: string;
    breakdowns?: string;
    vehicle: string;
    driver: string;
}

export type BreakdownSolution = "replacement" | "repair" | "recalled";

export interface Breakdown {

    vehicle: string;
    driver: string;
    mechanicAssigned: string;
    repairExpense: number;
    totalBudget: number;
    timeReported: FirebaseFirestore.Timestamp;
    timeFixed: FirebaseFirestore.Timestamp;
    totalDownTimeInHours?: number;
    damagedPart: string;
    solutionImplented: BreakdownSolution;
    report: string;
}



