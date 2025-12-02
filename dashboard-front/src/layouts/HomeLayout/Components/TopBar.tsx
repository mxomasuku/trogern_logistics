// src/layouts/HomeLayout/Components/TopBar.tsx
import UserMenu from "./UserMenu";
import { Menu } from "lucide-react"; // HIGHLIGHT (ADDED)

// HIGHLIGHT (ADDED): props for mobile sidebar toggle
interface TopBarProps {
  onToggleMobileSidebar?: () => void;
}

export default function TopBar({ onToggleMobileSidebar }: TopBarProps) {
  return (
    <header
      role="banner"
      className="
        sticky top-0 z-20
        bg-white/95
        backdrop-blur supports-[backdrop-filter]:bg-white/90
        shadow-sm
      "
    >
      <div className="flex h-12 items-center gap-3 px-3 sm:px-4">
        {/* HIGHLIGHT (ADDED): hamburger for mobile, does NOT push layout */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* HIGHLIGHT (EDITED): breadcrumbs + scroll kept, but in inner flex */}
        <div
          className="flex h-full flex-1 items-center gap-3 overflow-x-auto overscroll-x-contain"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
            <span className="text-sm text-slate-400 shrink-0">/</span>
            <span className="text-sm font-medium truncate text-slate-800">
              Home
            </span>
          </div>

          {/* Flexible spacer */}
          <div className="flex-1 min-w-[1rem]" />

          {/* Actions: keep compact on mobile, no wrap */}
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}