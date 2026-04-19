import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryIncomeLogs } from "@/api/income";
import { getVehicles } from "@/api/vehicles";
import { getDrivers } from "@/api/drivers";
import type { IncomeLog, Vehicle, Driver } from "@/types/types";
import { toast } from "sonner";
import { Search, Loader2, ArrowRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    if (!selectedId) return;
    const { start, end } = getLocalDatesFromWeek(year, week);
    const query = new URLSearchParams();
    query.set(mode === "vehicle" ? "vehicle" : "driverId", selectedId);
    query.set("start", start);
    query.set("end", end);
    navigate(`/app/income?${query.toString()}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-0 !rounded-2xl gap-0 p-0 overflow-hidden shadow-2xl">
        <div className="flex flex-col h-full bg-slate-50/50">
          <DialogHeader className="p-6 pb-4 border-b bg-white border-slate-100">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Search className="w-5 h-5" />
              </span>
              Active Query Builder
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Find specific mileage or income logs by time and assignees.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
               <div className="space-y-2">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</Label>
                 <Select value={mode} onValueChange={(v: "vehicle" | "driver") => { setMode(v); setSelectedId(""); setResults(null); }}>
                   <SelectTrigger className="bg-slate-50 border-0 h-10 shadow-none font-medium">
                     <SelectValue placeholder="Select type" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="vehicle" className="font-medium">Vehicle</SelectItem>
                     <SelectItem value="driver" className="font-medium">Driver</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-2 col-span-1 md:col-span-1">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                   {mode === "vehicle" ? "Vehicle" : "Driver"}
                 </Label>
                 <Select value={selectedId} onValueChange={setSelectedId}>
                   <SelectTrigger className="bg-slate-50 border-0 h-10 shadow-none font-medium">
                     <SelectValue placeholder={`Select ${mode}`} />
                   </SelectTrigger>
                   <SelectContent>
                     {mode === "vehicle"
                       ? vehicles.map(v => <SelectItem key={v.id!} value={v.plateNumber} className="font-medium">{v.plateNumber}</SelectItem>)
                       : drivers.map(d => <SelectItem key={d.id} value={d.id} className="font-medium">{d.name}</SelectItem>)
                     }
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-2">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</Label>
                 <Input 
                   type="number" 
                   value={year} 
                   onChange={e => setYear(Number(e.target.value))}
                   className="bg-slate-50 border-0 h-10 shadow-none font-medium" 
                 />
               </div>

               <div className="space-y-2">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Week #</Label>
                 <Input 
                   type="number" 
                   value={week} 
                   onChange={e => setWeek(Number(e.target.value))}
                   className="bg-slate-50 border-0 h-10 shadow-none font-medium" 
                   min={1} 
                   max={53}
                 />
               </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><Info className="w-4 h-4"/> Time bounds: {getLocalDatesFromWeek(year, week).start} to {getLocalDatesFromWeek(year, week).end}</p>
              <Button onClick={handleSearch} disabled={loadingResults} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 font-semibold shadow-md shadow-indigo-200">
                {loadingResults && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Query
              </Button>
            </div>

            {results !== null && (
              <div className="mt-6 border border-slate-100 bg-white rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-bold text-slate-700 text-sm">Results ({results.length})</h4>
                  <Button variant="ghost" size="sm" onClick={handleGoToMainRoute} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold h-8 rounded-lg">
                    View in Main Route <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {results.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium">No logs found for this period.</div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-auto">
                    {results.map(log => (
                      <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div>
                          <div className="font-bold text-slate-800">${log.amount} <span className="text-slate-400 font-medium ml-1 text-sm">({log.type})</span></div>
                          <div className="text-sm text-slate-500 mt-0.5">{log.vehicle} • {log.driverName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-rose-500">{log.weekEndingMileage === 0 ? "00 Mileage!" : `${log.weekEndingMileage} km`}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">Cash Date: {new Date(log.cashDate._seconds * 1000).toLocaleDateString()}</div>
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
