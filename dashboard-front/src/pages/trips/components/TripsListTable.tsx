// src/pages/trips/components/TripsListTable.tsx
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Play, CheckCircle } from "lucide-react";
import type { TripListItem } from "../types";
import { TripStatusBadge } from "./TripStatusBadge";
import { formatCurrency, formatDateShort, canStartTrip, canCompleteTrip } from "../utils";

interface TripsListTableProps {
    trips: TripListItem[];
    onView: (trip: TripListItem) => void;
    onEdit: (trip: TripListItem) => void;
    onDelete: (trip: TripListItem) => void;
    onStart?: (trip: TripListItem) => void;
    onComplete?: (trip: TripListItem) => void;
}

export function TripsListTable({
    trips,
    onView,
    onEdit,
    onDelete,
    onStart,
    onComplete
}: TripsListTableProps) {
    return (
        <div className="overflow-x-auto">
            <Table>
                {/* Sticky header + subtle divider */}
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Trip ID</TableHead>
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Client</TableHead>
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Route</TableHead>
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Driver</TableHead>
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Scheduled</TableHead>
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Distance</TableHead>
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Income</TableHead>
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Profit</TableHead>
                        <TableHead className="text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Status</TableHead>
                        <TableHead className="text-right text-slate-500 uppercase font-medium text-[11px] sm:text-xs">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                {/* Zebra rows + divide-y like IncomeList */}
                <TableBody className="divide-y divide-slate-100">
                    {trips.map((trip) => (
                        <TableRow
                            key={trip.tripId}
                            className="odd:bg-slate-50 hover:bg-blue-50/70 transition-colors cursor-pointer"
                            onClick={() => onView(trip)}
                        >
                            <TableCell className="font-mono text-sm text-blue-600 font-medium">
                                {trip.tripId}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">{trip.client.clientName}</span>
                                    <span className="text-xs text-slate-500">{trip.client.clientPhone}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col max-w-xs">
                                    <span className="text-sm text-slate-900 truncate">
                                        {trip.route.origin}
                                    </span>
                                    <span className="text-xs text-slate-500 truncate">
                                        → {trip.route.destination}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-slate-900">{trip.driverName}</TableCell>
                            <TableCell className="text-slate-600 text-sm">
                                {formatDateShort(trip.scheduledStartAt)}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900">
                                        {trip.expectedDistanceKm} km
                                    </span>
                                    {trip.actualDistanceKm !== undefined && (
                                        <span className="text-xs text-slate-500">
                                            Actual: {trip.actualDistanceKm} km
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-emerald-700 font-semibold">
                                {formatCurrency(trip.incomeGross, trip.incomeCurrency)}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    {trip.financials.actualProfit !== undefined ? (
                                        <>
                                            <span className={`font-semibold ${trip.financials.actualProfit >= 0 ? "text-emerald-700" : "text-red-700"
                                                }`}>
                                                {formatCurrency(trip.financials.actualProfit, trip.incomeCurrency)}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                (Est: {formatCurrency(trip.financials.estimatedProfit, trip.incomeCurrency)})
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-slate-700 font-medium">
                                            {formatCurrency(trip.financials.estimatedProfit, trip.incomeCurrency)}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <TripStatusBadge status={trip.status} />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                    {canStartTrip(trip) && onStart && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => onStart(trip)}
                                            title="Start trip"
                                        >
                                            <Play className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {canCompleteTrip(trip) && onComplete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                            onClick={() => onComplete(trip)}
                                            title="Complete trip"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 text-sky-700 hover:text-sky-800 hover:bg-blue-50"
                                        onClick={() => onView(trip)}
                                        title="View details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {trip.status !== "completed" && trip.status !== "cancelled" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                            onClick={() => onEdit(trip)}
                                            title="Edit trip"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => onDelete(trip)}
                                        title="Delete trip"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
