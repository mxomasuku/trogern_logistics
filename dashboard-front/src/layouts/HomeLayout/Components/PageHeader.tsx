// src/components/PageHeader.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

type PageHeaderProps = {
  /** Main title text, e.g., "Vehicle" */
  titleMain: string;
  /** Accent word rendered with sky color, e.g., "Management" */
  titleAccent?: string;

  /** Current search value (controlled) */
  searchValue?: string;
  /** Called with new search value */
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search input */
  searchPlaceholder?: string;

  /** Show the search UI (desktop + mobile) */
  enableSearch?: boolean;

  /** Mobile search toggler (controlled) */
  showSearchMobile?: boolean;
  setShowSearchMobile?: (open: boolean) => void;

  /** Add button config: either pass `to` (route) or `onAdd` (callback) */
  addLabel?: string; // default: "Add"
  addTo?: string;
  onAdd?: () => void;

  /** Optional: override button classes */
  addButtonClassName?: string;

  /** Optional: extra controls on the right (e.g., filters) */
  rightExtras?: React.ReactNode;
};

export function PageHeader({
  titleMain,
  titleAccent,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search…",
  enableSearch = true,
  showSearchMobile = false,
  setShowSearchMobile,
  addLabel = "Add",
  addTo,
  onAdd,
  addButtonClassName,
  rightExtras,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleAddClick = React.useCallback(() => {
    if (onAdd) return onAdd();
    if (addTo) navigate(addTo);
  }, [onAdd, addTo, navigate]);

  const toggleMobileSearch = React.useCallback(() => {
    if (setShowSearchMobile) setShowSearchMobile(!showSearchMobile);
  }, [setShowSearchMobile, showSearchMobile]);

  return (
    <CardHeader className="pb-0">
      {/* Title */}
      <CardTitle className="text-xl font-semibold text-blue-700">
        {titleMain}{" "}
        {titleAccent ? <span className="text-sky-500">{titleAccent}</span> : null}
      </CardTitle>

      {/* Controls */}
      <div className="mt-3 flex items-center gap-2">
        {/* Search (sm+ visible) */}
        {enableSearch && (
          <div className="relative hidden sm:block">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <Input
              className="h-9 pl-8 w-64 rounded-md border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        )}

        {/* Add (sm+ label, xs icon-only) */}
        {(addTo || onAdd) && (
          <>
            <Button
              onClick={handleAddClick}
              size="sm"
              className={
                addButtonClassName ??
                "hidden sm:inline-flex bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600 text-white shadow-sm rounded-md"
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              {addLabel}
            </Button>

            {/* Mobile icon-only: Search toggle */}
            {enableSearch && setShowSearchMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sm:hidden h-9 w-9 text-blue-600 hover:bg-blue-50"
                aria-label="Search"
                onClick={toggleMobileSearch}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Mobile icon-only: Add */}
            <Button
              type="button"
              size="icon"
              className="sm:hidden h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white"
              aria-label={addLabel}
              onClick={handleAddClick}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Right-side extra controls (filters, menus, etc.) */}
        {rightExtras}
      </div>

      {/* Mobile search input */}
      {enableSearch && showSearchMobile && (
        <div className="mt-2 sm:hidden">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-400" />
            <Input
              className="h-9 pl-8 w-full rounded-md border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>
      )}
    </CardHeader>
  );
}