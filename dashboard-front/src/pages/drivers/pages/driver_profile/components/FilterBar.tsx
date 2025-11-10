// src/pages/drivers/pages/components/FilterBar.tsx
import { Input } from "@/components/ui/input";

export function FilterBar({
  value,
  onChange,
  placeholder = "Filter…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="w-full md:w-72">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 rounded-lg border-0 bg-blue-50/60 text-blue-950 placeholder:text-blue-300
                     focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0"
        />
      </div>
    </div>
  );
}