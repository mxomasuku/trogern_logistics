import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/drivers", label: "Drivers" },
  { to: "/vehicles", label: "Vehicles" },
  { to: "/service", label: "Service" },
];

const Nav: FC = () => {
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-3">
        <NavLink to="/" className="font-semibold tracking-tight">Trogern</NavLink>

        <ul className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "text-foreground"
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <DarkModeToggle />
          <form action="/logout" method="post">
            <Button size="sm">Logout</Button>
          </form>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>

              <ul className="mt-4 space-y-1">
                {links.map((l) => (
                  <li key={l.to}>
                    <NavLink
                      to={l.to}
                      className={({ isActive }) =>
                        cn(
                          "block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                          isActive ? "bg-accent text-accent-foreground" : "text-foreground"
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Theme</span>
                <DarkModeToggle />
              </div>

              <div className="mt-4">
                <form action="/logout" method="post">
                  <Button className="w-full">Logout</Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Nav;