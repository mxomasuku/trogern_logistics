import ThemeToggle from "@/pages/auth/ThemeToggle";
import UserMenu from "./UserMenu";

export default function TopBar() {
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
      {/* Horizontal scroll container for small screens */}
      <div
        className="flex h-12 items-center gap-3 px-4 overflow-x-auto overscroll-x-contain"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Keep items on one line, allow scroll if they don't fit */}
        <div className="flex items-center gap-3 min-w-0 whitespace-nowrap">
          <span className="text-sm text-slate-400 shrink-0">/</span>
          <span className="text-sm font-medium truncate text-slate-800">Home</span>
        </div>

        {/* Flexible spacer */}
        <div className="flex-1 min-w-[1rem]" />

        {/* Actions: keep compact on mobile, no wrap */}
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}