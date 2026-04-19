import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { ActiveSearchModal } from "@/components/ActiveSearchModal";

// HIGHLIGHT (EDITED): props for mobile sidebar toggle + user identity
interface TopBarProps {
  onToggleMobileSidebar?: () => void;
  userName?: string;
  userRole?: string; // HIGHLIGHT
}

export default function TopBar({
  onToggleMobileSidebar,
  userName,
  userRole,
}: TopBarProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  console.log("user object:", userRole);

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
        {/* HIGHLIGHT: hamburger for mobile, does NOT push layout */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* HIGHLIGHT (EDITED): right cluster = notifications + user identity + menu */}
        <div className="flex h-full flex-1 items-center justify-between gap-3">
          {/* Left side placeholder (breadcrumbs / title in future) */}
          <div className="min-w-0" />

          {/* Right side: notifications + user info */}
          <div className="flex items-center gap-3 shrink-0">
            {/* HIGHLIGHT: Active Search Tool */}
            <button
              onClick={() => setSearchModalOpen(true)}
              title="Active Search Tool"
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors focus:outline-none"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* HIGHLIGHT: real-time notification bell with dropdown */}
            <NotificationBell />

            {/* HIGHLIGHT: user identity block + online indicator */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex max-w-[140px] flex-col items-end leading-tight sm:max-w-[180px]">
                <span className="text-sm font-medium truncate text-slate-800">
                  {userName ?? ""}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                  {/* HIGHLIGHT: green dot = connected */}
                  <span className="truncate">
                    {userRole ?? "Connected"} {/* HIGHLIGHT: role subtext */}
                  </span>
                </div>
              </div>


            </div>
          </div>
        </div>
        {/* HIGHLIGHT END */}
      </div>

      <ActiveSearchModal 
        isOpen={searchModalOpen} 
        onOpenChange={setSearchModalOpen} 
      />
    </header>
  );
}