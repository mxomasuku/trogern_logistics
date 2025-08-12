import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  CarFront,
  DollarSign,
  Wrench,
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  Users,
  Activity,
} from "lucide-react";
import { StatCard } from "./components/StatCard";


type Action = {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  to: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
};

const ACTIONS: Action[] = [
  { title: "Add Driver",     description: "Create a new driver profile", icon: UserPlus,     to: "/drivers/add" },
  { title: "View Vehicle List", description: "View all vehicles",      icon: CarFront,     to: "/vehicles" },
  { title: "Add Revenue",    description: "Record daily/weekly income",  icon: DollarSign,   to: "/income/new" },
  { title: "Log Service",    description: "Oil, filters, tires, etc.",   icon: Wrench,       to: "/service/new" },
  { title: "Log Breakdown",  description: "Tow, faults, downtime",       icon: AlertTriangle,to: "/breakdowns/new", variant: "secondary" },
  { title: "Log Arrest",     description: "ZRP/Zinara, fines & details", icon: ShieldAlert,  to: "/incidents/arrest/new", variant: "secondary" },
  { title: "Contact Mechanic", description: "Call / assign job",         icon: PhoneCall,    to: "/mechanic" },
];

export default function Home() {
  const navigate = useNavigate();



  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Quick Actions</h1>
        <p className="text-sm text-muted-foreground">Your most common tasks, one click away.</p>
      </section>

      {/* Actions Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ACTIONS.map(({ title, description, icon: Icon, to }) => (
          <Card
            key={title}
            className="group cursor-pointer transition-colors hover:bg-accent"
            onClick={() => navigate(to)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
              </div>
              <div className="rounded-xl border p-2 text-muted-foreground transition-colors group-hover:text-foreground">
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Live stats */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Live Ops</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Active Drivers"
            description="Currently on the road"
            value={4}
            icon={<Users className="h-5 w-5" />}
            onClick={() => navigate("/drivers?filter=active")}
          />
          <StatCard
            title="Open Breakdowns"
            description="Needing attention"
            value={ 1}
            icon={<Activity className="h-5 w-5" />}
            onClick={() => navigate("/breakdowns?status=open")}
          />
        </div>
      </section>

      {/* Optional secondary area (kept) */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Today’s Ops</h2>
              <p className="text-xs text-muted-foreground">
                Quick view of runs, issues, and revenue.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/reports/today")}>
              View
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Recent Activity</h2>
              <p className="text-xs text-muted-foreground">Latest service logs & incidents.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/activity")}>
              View
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}