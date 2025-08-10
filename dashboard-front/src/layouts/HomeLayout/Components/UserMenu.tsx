// src/components/layout/UserMenu.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, User, Settings } from "lucide-react";
import { getInitialDark, setDark } from "@/lib/theme";
import { DarkModeToggle } from "./dark-mode-toggle";

export default function UserMenu() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(getInitialDark());

  useEffect(() => { setDark(isDark); }, [isDark]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-2 rounded-full p-1 hover:bg-accent focus:outline-none"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="User" />
            <AvatarFallback>MM</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Account</span>
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Dark mode toggle item (keeps menu open) */}
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="flex items-center justify-between px-2 py-2 focus:bg-transparent"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>Dark mode</span>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={(v) => setIsDark(!!v)}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Toggle dark mode"
          />
        </DropdownMenuItem>
        <DarkModeToggle/>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}