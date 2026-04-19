import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { queryIncomeLogs } from "@/api/income";
import { getVehicles } from "@/api/vehicles";
import { getDrivers } from "@/api/drivers";
import type { IncomeLog, Vehicle, Driver } from "@/types/types";
import { toast } from "sonner";
import { Search, Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

function baseInputClasses() {
  return "h-10 rounded-lg border-0 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 focus-visible:ring-offset-slate-900 px-3 w-full";
}

interface ActiveSearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function getLocalDatesFromWeek(year: number, week: number) {
  // Approximate ISO week 
  const jan4 = new Date(year, 0, 4);
  const diff = jan4.getDay() === 0 ? 6 : jan4.getDay() - 1;
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - diff);

  const targetMonday = new Date(startOfWeek1);
  targetMonday.setDate(startOfWeek1.getDate() + (week - 1) * 7);

  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);
  targetSunday.setHours(23, 59, 59, 999);

  // Format as YYYY-MM-DD local
  const pad = (n: number) => n.toString().padStart(2, "0");
  const start = `${targetMonday.getFullYear()}-${pad(targetMonday.getMonth() + 1)}-${pad(targetMonday.getDate())}`;
  const end = `${targetSunday.getFullYear()}-${pad(targetSunday.getMonth() + 1)}-${pad(targetSunday.getDate())}`;

  return { start, end };
}

export function ActiveSearchModal({ isOpen, onOpenChange }: ActiveSearchModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"vehicle" | "driver">("vehicle");
  const [selectedId, setSelectedId] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  // Basic week estimation for initial value
  const [week, setWeek] = useState<number>(() => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<IncomeLog[] | null>(null);

  useEffect(() => {
    if (isOpen && vehicles.length === 0 && drivers.length === 0) {
      setLoadingLookups(true);
      Promise.all([getVehicles(), getDrivers()])
        .then(([vRes, dRes]) => {
          setVehicles(vRes);
          setDrivers(dRes);
        })
        .catch(() => toast.error("Failed to load lookup data"))
        .finally(() => setLoadingLookups(false));
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!selectedId) {
      toast.error(`Please select a ${mode}`);
      return;
    }

    setLoadingResults(true);
    setResults(null);
    try {
      const { start, end } = getLocalDatesFromWeek(year, week);
      const params = {
        start,
        end,
        ...(mode === "vehicle" ? { vehicle: selectedId } : { driverId: selectedId })
      };
      const data = await queryIncomeLogs(params);
      setResults(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to search logs");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleGoToMainRoute = () => {
    let url = `/app/income`;
    if (selectedId) {
      const { start, end } = getLocalDatesFromWeek(year, week);
      const query = new URLSearchParams();
      query.set(mode === "vehicle" ? "vehicle" : "driverId", selectedId);
      query.set("start", start);
      query.set("end", end);
      url += `?${query.toString()}`;
    }
    navigate(url);
    onOpenChange(false);
  };

  const handleClear = () => {
    setSelectedId("");
    setResults(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 !rounded-2xl gap-0 p-0 overflow-hidden shadow-2xl">
        <div className="flex flex-col h-full bg-slate-950">
          <DialogHeader className="p-6 pb-4 border-b bg-slate-950 border-slate-800">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-100">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Search className="w-5 h-5" />
              </span>
              Active Query Builder
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Find specific mileage or income logs by time and assignees.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</Label>
                <select
                  disabled={loadingLookups}
                  value={mode}
                  onChange={(e: any) => { setMode(e.target.value); setSelectedId(""); setResults(null); }}
                  className={baseInputClasses()}
                >
                  <option value="vehicle">Vehicle</option>
                  <option value="driver">Driver</option>
                </select>
              </div>

              <div className="space-y-2 col-span-1 md:col-span-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {mode === "vehicle" ? "Vehicle" : "Driver"}
                </Label>
                <select
                  disabled={loadingLookups}
                  value={selectedId}
                  onChange={(e: any) => setSelectedId(e.target.value)}
                  className={baseInputClasses()}
                >
                  <option value="">{loadingLookups ? "Loading..." : `Select ${mode}`}</option>
                  {mode === "vehicle"
                    ? vehicles.map(v => <option key={v.id!} value={v.plateNumber}>{v.plateNumber}</option>)
                    : drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                  }
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className={baseInputClasses()}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Week #</Label>
                <Input
                  type="number"
                  value={week}
                  onChange={e => setWeek(Number(e.target.value))}
                  className={baseInputClasses()}
                  min={1}
                  max={53}
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">

              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleClear} size="sm" className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">
                  <RotateCcw className="w-4 h-4 mr-1" /> Clear
                </Button>
                <Button variant="outline" size="sm" onClick={handleGoToMainRoute} className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 font-semibold h-8 rounded-lg shadow-sm">
                  Main Base <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button onClick={handleSearch} disabled={loadingResults} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 font-semibold shadow-md shadow-indigo-900/20 h-8 ml-2">
                  {loadingResults && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Run Query
                </Button>
              </div>
            </div>

            {results !== null && (
              <div className="mt-6 border border-slate-800 bg-slate-900 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                  <h4 className="font-bold text-slate-200 text-sm">Results ({results.length})</h4>
                </div>
                {results.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-medium">No logs found for this period.</div>
                ) : (
                  <div className="divide-y divide-slate-800 max-h-[300px] overflow-auto">
                    {results.map(log => (
                      <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-100">${log.amount} <span className="text-slate-500 font-medium ml-1 text-sm">({log.type})</span></div>
                          <div className="text-sm text-slate-400 mt-0.5">{log.vehicle} • {log.driverName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-rose-400">{log.weekEndingMileage === 0 ? "00 Mileage!" : `${log.weekEndingMileage} km`}</div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">Cash Date: {new Date(log.cashDate._seconds * 1000).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
