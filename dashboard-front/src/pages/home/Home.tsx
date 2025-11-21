import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  CarFront,
  DollarSign,
  Wrench,
  Users,
  Activity,
  BarChart3, // HIGHLIGHT: new icon
} from "lucide-react";
import { StatCard } from "./components/StatCard";

type Action = {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  to: string;
};

const ACTIONS: Action[] = [
    { title: "Add Revenue", description: "Record daily/weekly income", icon: DollarSign, to: "/app/income/add" },
  { title: "Add Driver", description: "Create a new driver profile", icon: UserPlus, to: "/app/drivers/add" },
  { title: "View Vehicles", description: "All fleet vehicles", icon: CarFront, to: "/app/vehicles" },
  { title: "Log Service", description: "Oil, filters, tires, etc.", icon: Wrench, to: "/app/service/add" },
];

// HIGHLIGHT: placeholder cash-in data – later to be wired to Firestore
const MOCK_CASH_IN = [
  { name: "Probox BYO-241", value: 0.9, amount: 180 },
  { name: "Probox HRE-077", value: 0.76, amount: 152 },
  { name: "Honda Fit MWE-310", value: 0.62, amount: 124 },
  { name: "Reserved unit", value: 0.31, amount: 62 },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-blue-700">
          Quick <span className="text-sky-500">Actions</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Your most common tasks, one click away.
        </p>
      </section>

      {/* Actions Grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ACTIONS.map(({ title, description, icon: Icon, to }) => (
          <Card
            key={title}
            onClick={() => navigate(to)}
            className="group cursor-pointer bg-white hover:bg-blue-50 active:bg-blue-100
                       transition-all duration-200 rounded-xl p-2 shadow-none hover:shadow-md border-0"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 border-0">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold text-blue-800 group-hover:text-blue-900">
                  {title}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  {description}
                </CardDescription>
              </div>
              <div className="rounded-lg bg-white p-2 text-blue-500 group-hover:text-blue-700 transition-colors border-0">
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* HIGHLIGHT: Fleet performance KPIs + cash-in-by-vehicle chart */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-600">Fleet performance</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Active vehicles */}
          <Card className="bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-xl shadow-md border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  Active vehicles
                </CardTitle>
                <CardDescription className="text-[11px] text-blue-100/80">
                  Currently generating revenue
                </CardDescription>
              </div>
              <div className="rounded-lg bg-white/15 p-2">
                <CarFront className="h-4 w-4" />
              </div>
            </CardHeader>
            <div className="px-4 pb-4">
              <div className="text-2xl font-semibold tracking-tight">7</div>
              <p className="text-[11px] text-blue-100/80 mt-1">
                1 parked · 0 off-road
              </p>
            </div>
          </Card>

          {/* Revenue this week */}
          <Card className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-xl shadow-md border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  Revenue · this week
                </CardTitle>
                <CardDescription className="text-[11px] text-indigo-100/80">
                  Versus last week
                </CardDescription>
              </div>
              <div className="rounded-lg bg-white/15 p-2">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <div className="px-4 pb-4">
              <div className="text-2xl font-semibold tracking-tight">
                $4,820
              </div>
              <p className="text-[11px] text-emerald-100 mt-1">
                +18% vs previous week
              </p>
            </div>
          </Card>

          {/* Revenue this month */}
          <Card className="bg-gradient-to-br from-sky-600 to-cyan-500 text-white rounded-xl shadow-md border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">
                  Revenue · this month
                </CardTitle>
                <CardDescription className="text-[11px] text-sky-100/80">
                  Month-to-date performance
                </CardDescription>
              </div>
              <div className="rounded-lg bg-white/15 p-2">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <div className="px-4 pb-4">
              <div className="text-2xl font-semibold tracking-tight">
                $18,430
              </div>
              <p className="text-[11px] text-emerald-100 mt-1">
                On track to exceed target
              </p>
            </div>
          </Card>

          {/* Cash-in by vehicle mini-chart */}
          <Card className="rounded-xl shadow-md border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold text-blue-800">
                  Cash-in by vehicle
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500">
                  Today / this week snapshot
                </CardDescription>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <BarChart3 className="h-4 w-4" />
              </div>
            </CardHeader>
            <div className="px-4 pb-4 space-y-2">
              {MOCK_CASH_IN.map((vehicle) => (
                <div key={vehicle.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span className="truncate max-w-[60%]">{vehicle.name}</span>
                    <span className="font-medium text-gray-800">
                      {vehicle.amount} USD
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${vehicle.value * 100}%`,
                        background:
                          "linear-gradient(90deg, #1D4ED8, #6366F1)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
      {/* HIGHLIGHT END */}

      {/* Live stats */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-600">Live Ops</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
          <StatCard
            title="Active Drivers"
            description="Currently on the road"
            value={4}
            icon={<Users className="h-5 w-5 text-sky-600" />}
            onClick={() => navigate("/drivers?filter=active")}
          />
          <StatCard
            title="Open Breakdowns"
            description="Needing attention"
            value={1}
            icon={<Activity className="h-5 w-5 text-blue-700" />}
            onClick={() => navigate("/breakdowns?status=open")}
          />
        </div>
      </section>

      {/* Secondary area */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 bg-white hover:bg-blue-50 transition-all rounded-xl hover:shadow-md shadow-none border-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-blue-800">Today’s Ops</h2>
              <p className="text-xs text-gray-500">
                Quick view of runs, issues, and revenue.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:bg-blue-100"
              onClick={() => navigate("/reports/today")}
            >
              View
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-white hover:bg-blue-50 transition-all rounded-xl hover:shadow-md shadow-none border-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-blue-800">Recent Activity</h2>
              <p className="text-xs text-gray-500">Latest service logs & incidents.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:bg-blue-100"
              onClick={() => navigate("/activity")}
            >
              View
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}