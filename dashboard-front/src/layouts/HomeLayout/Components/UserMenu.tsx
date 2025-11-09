import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";


export default function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

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
          "absolute right-0 mt-2 w-56 select-none rounded-xl z-50 overflow-hidden",
          "bg-white dark:bg-neutral-900",
          "border border-gray-200 dark:border-gray-800 shadow-xl",
          "text-gray-900 dark:text-gray-100",
          "origin-top-right transition-all",
          open
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        <div className="relative">
          <div className="px-3 py-2 text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Account
          </div>

          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/account");
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md
                       hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <Settings className="h-4 w-4 text-blue-500" />
            Account settings
          </button>

          <div className="my-2 h-px bg-gray-200 dark:bg-gray-700" />

      

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