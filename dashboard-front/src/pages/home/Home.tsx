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
} from "lucide-react";
import { StatCard } from "./components/StatCard";

type Action = {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  to: string;
};

const ACTIONS: Action[] = [
  { title: "Add Driver", description: "Create a new driver profile", icon: UserPlus, to: "/drivers/add" },
  { title: "View Vehicles", description: "All fleet vehicles", icon: CarFront, to: "/vehicles" },
  { title: "Add Revenue", description: "Record daily/weekly income", icon: DollarSign, to: "/income/add" },
  { title: "Log Service", description: "Oil, filters, tires, etc.", icon: Wrench, to: "/service/add" },
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