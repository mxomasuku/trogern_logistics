// src/pages/income/IncomePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // HIGHLIGHT
import { listIncomeLogs, deleteIncomeLog } from "@/api/income";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { List } from "lucide-react";
import { toast } from "sonner";
import { IncomeList } from "./components/IncomeList";
import { DeleteIncomeModal } from "./components/DeleteIncomeModal";
import type { IncomeLog } from "@/types/types";
import { PageHeader } from "@/layouts/HomeLayout/Components/PageHeader";
import { useAuth } from "@/state/AuthContext"; // HIGHLIGHT: for isOwnerOrManager

export default function IncomePage() {
  const [items, setItems] = useState<IncomeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteIncome = (row: IncomeLog) => {
    if (!canEditIncome) {
      toast.error("You do not have permission to delete income logs.");
      return;
    }
    if (!row.id) {
      toast.error("Missing income log id.");
      return;
    }

    // Open delete modal
    setIncomeToDelete(row);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!incomeToDelete?.id) return;

    setIsDeleting(true);
    try {
      await deleteIncomeLog(incomeToDelete.id);
      toast.success("Income log deleted successfully");
      setDeleteModalOpen(false);
      setIncomeToDelete(null);
      // Refresh the list
      load();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete income log");
    } finally {
      setIsDeleting(false);
    }
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
              // Delete functionality
              onDelete={handleDeleteIncome}
              canDelete={canEditIncome}
            />
          </CardContent>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteIncomeModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        incomeLog={incomeToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}