// src/components/layout/SideLink.tsx
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  active: boolean;
  className?: string;       // <--- add
  iconClassName?: string;   // <--- add
  activeClassName?: string; // <--- add
};

export default function SideLink({
  to,
  label,
  icon: Icon,
  collapsed,
  active,
  className,
  iconClassName,
  activeClassName,
}: Props) {
  return (
    <NavLink
      to={to}
      className={cn(
        "group flex items-center gap-3 text-sm rounded-lg px-3 py-2",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        active ? (activeClassName || "bg-accent text-foreground") : "text-muted-foreground",
        collapsed && "justify-center px-2",
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", iconClassName)} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}