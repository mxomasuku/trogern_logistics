
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export default function SideLink({
  to, icon: Icon, label, collapsed, active,
}: {
  to: string;
  icon: IconType;
  label: string;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary hover:bg-primary/15"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}