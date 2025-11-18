// src/pages/ServiceHubPage.tsx
'use client';

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ListChecks, Wrench } from "lucide-react";
import { AddServiceItemModal } from "./components/AddServiceItemModal";

export default function ServiceHubPage() {
  const [openItemModal, setOpenItemModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-none border-0 rounded-2xl ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-700">
            Service <span className="text-sky-500">&amp; Maintenance</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-3">
          {/* Add Service */}
          <ActionButton
            label="Add Service"
            icon={<Wrench className="h-6 w-6 text-sky-600 group-hover:text-white transition-colors" />}
            gradient="from-blue-500 via-sky-500 to-indigo-500"
            onClick={() => navigate("/app/service/add")}
          />

          {/* View Records */}
          <ActionButton
            label="View Records"
            icon={<ListChecks className="h-6 w-6 text-sky-600 group-hover:text-white transition-colors" />}
            variant="secondary"
            gradient="from-sky-100 via-sky-50 to-white"
            onClick={() => navigate("/app/service/records")}
          />

          {/* Add Service Item */}
          <ActionButton
            label="Add Service Item"
            icon={<Plus className="h-6 w-6 text-sky-600 group-hover:text-white transition-colors" />}
            variant="outline"
            gradient="from-white via-blue-50 to-sky-100"
            onClick={() => setOpenItemModal(true)}
          />
        </CardContent>
      </Card>

      <AddServiceItemModal open={openItemModal} onOpenChange={setOpenItemModal} />
    </div>
  );
}

/* ---------- Shared Action Card Button ---------- */
function ActionButton({
  label,
  icon,
  onClick,
  variant,
  gradient,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "secondary" | "outline";
  gradient?: string;
}) {
  const base =
    "h-28 sm:h-32 flex flex-col items-center justify-center gap-2 rounded-xl transition-all " +
    "shadow-sm hover:shadow-md text-sm font-medium group";

  const variants: Record<string, string> = {
    default:
      `bg-gradient-to-r ${gradient || "from-blue-500 via-sky-500 to-indigo-500"} 
       text-white hover:scale-[1.02] active:scale-[0.99]`,
    secondary:
      `bg-gradient-to-br ${gradient || "from-sky-50 via-white to-blue-50"} 
       text-blue-800 ring-1 ring-inset ring-blue-100 hover:bg-sky-100`,
    outline:
      `bg-gradient-to-tr ${gradient || "from-white via-slate-50 to-blue-50"} 
       text-blue-800 ring-1 ring-inset ring-blue-200 hover:bg-sky-50`,
  };

  const style = variant ? variants[variant] : variants.default;

  return (
    <button onClick={onClick} className={`${base} ${style}`}>
      <div className="rounded-full bg-white/30 group-hover:bg-white/20 p-2 transition-colors">
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}