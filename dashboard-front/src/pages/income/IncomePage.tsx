// src/pages/income/IncomePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // HIGHLIGHT
import { listIncomeLogs } from "@/api/income";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { List } from "lucide-react";
import { toast } from "sonner";
import { IncomeList } from "./components/IncomeList";
import type { IncomeLog } from "@/types/types";
import { PageHeader } from "@/layouts/HomeLayout/Components/PageHeader";
import { useAuth } from "@/state/AuthContext"; // HIGHLIGHT: for isOwnerOrManager

export default function IncomePage() {
  const [items, setItems] = useState<IncomeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);

  const navigate = useNavigate();
  const { isOwnerOrManager } = useAuth(); // HIGHLIGHT
  const canEditIncome = isOwnerOrManager; // HIGHLIGHT

  const load = async () => {
    setLoading(true);
    try {
      const incomeLogsResult = await listIncomeLogs();
      setItems(incomeLogsResult);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to fetch income");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // HIGHLIGHT: same pattern as DriversPage → DriverTable
  const handleEditIncome = (row: IncomeLog) => {
    // HIGHLIGHT: debug log to confirm this is reached
    console.log("[IncomePage] handleEditIncome called", {
      id: row.id,
      canEditIncome,
    });

    if (!canEditIncome) {
      toast.error("You do not have permission to edit income logs.");
      return;
    }
    if (!row.id) {
      toast.error("Missing income log id.");
      return;
    }

    navigate(`/app/income/add?id=${row.id}`);
  };

  return (
    <div className="mx-auto space-y-4">
      {/* Main Income Card */}
      <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
        <PageHeader
          titleMain="Income"
          titleAccent="Management"
          enableSearch={false}
          addLabel="Add Income"
          addTo="/app/income/add"
          rightExtras={
            <Button
              variant={showList ? "secondary" : "outline"}
              onClick={() => setShowList((value) => !value)}
              className="border-blue-200 text-blue-800 hover:bg-blue-50"
            >
              <List className="h-4 w-4 mr-2" />
              {showList ? "Hide List" : "View List"}
            </Button>
          }
        />

        {showList && (
          <CardContent>
            <IncomeList
              items={items}
              loading={loading}
              currency="USD"
              // HIGHLIGHT: this is what the pencil calls
              onEdit={handleEditIncome}
              // HIGHLIGHT: pencil visibility + click gate
              canEdit={canEditIncome}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}