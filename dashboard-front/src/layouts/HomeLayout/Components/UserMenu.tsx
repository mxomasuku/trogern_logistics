import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Moon, Sun, User } from "lucide-react";
import { getInitialDark, setDark } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { DarkModeToggle } from "./dark-mode-toggle";

export default function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(getInitialDark());
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setDark(isDark);
  }, [isDark]);

  // close on outside click / Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full p-1 hover:bg-accent focus:outline-none"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt="User" />
          <AvatarFallback>MM</AvatarFallback>
        </Avatar>
      </button>

      <div
        role="menu"
        data-open={open ? "true" : "false"}
        className={cn(
          "absolute right-0 mt-2 w-56 select-none rounded-xl z-50 overflow-hidden", // overflow-hidden so overlay rounds too
          // Solid-but-glass surface (explicit colors to avoid token translucency)
          "bg-white/70 dark:bg-neutral-900/70",
          "backdrop-blur-md supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:dark:bg-neutral-900/55",
          // Border/ring for contrast
          "border border-black/5 dark:border-white/10 shadow-2xl ring-1 ring-black/5",
          // Text color per theme
          "text-slate-900 dark:text-neutral-100",
          // Animate in
          "origin-top-right transition-all",
          open ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* 👇 Inner gradient overlay to ensure readability on light & dark */}
        <div
          className="
            pointer-events-none absolute inset-0
            bg-gradient-to-b from-white/40 to-white/10
            dark:from-black/40 dark:to-black/10
            mix-blend-normal
          "
        />

        <div className="relative">
          <div className="px-3 py-2 text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </div>

          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/account");
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md
                       hover:bg-black/5 hover:dark:bg-white/10"
          >
            <Settings className="h-4 w-4" />
            Account settings
          </button>

          <div className="my-2 h-px bg-black/10 dark:bg-white/10" />

  <DarkModeToggle/>

          <div className="p-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}