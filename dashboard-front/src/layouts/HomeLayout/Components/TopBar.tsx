// src/components/layout/TopBar.tsx
import UserMenu from "./UserMenu";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center gap-3 px-4">
        {/* left: crumbs/title placeholder */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">Home</span>
        </div>

        <div className="flex-1" />
        <UserMenu />
      </div>
    </header>
  );
}