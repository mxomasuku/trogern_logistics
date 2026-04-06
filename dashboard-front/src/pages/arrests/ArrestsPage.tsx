// src/pages/arrests/ArrestsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listArrests, deleteArrest } from "@/api/arrests";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrestList } from "./components/ArrestList";
import { DeleteArrestModal } from "./components/DeleteArrestModal";
import type { ArrestLog } from "@/types/types";
import { PageHeader } from "@/layouts/HomeLayout/Components/PageHeader";
import { useAuth } from "@/state/AuthContext";

export default function ArrestsPage() {
  const [items, setItems] = useState<ArrestLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [arrestToDelete, setArrestToDelete] = useState<ArrestLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const { isOwnerOrManager } = useAuth();
  const canEdit = isOwnerOrManager;

  const load = async () => {
    setLoading(true);
    try {
      const result = await listArrests();
      setItems(result);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to fetch arrests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEdit = (row: ArrestLog) => {
    if (!canEdit) {
      toast.error("You do not have permission to edit arrests.");
      return;
    }
    if (!row.id) {
      toast.error("Missing arrest id.");
      return;
    }
    navigate(`/app/arrests/log?id=${row.id}`);
  };

  const handleDelete = (row: ArrestLog) => {
    if (!canEdit) {
      toast.error("You do not have permission to delete arrests.");
      return;
    }
    if (!row.id) {
      toast.error("Missing arrest id.");
      return;
    }
    setArrestToDelete(row);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!arrestToDelete?.id) return;

    setIsDeleting(true);
    try {
      await deleteArrest(arrestToDelete.id);
      toast.success("Arrest deleted successfully");
      setDeleteModalOpen(false);
      setArrestToDelete(null);
      load();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete arrest");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto space-y-4">
      <Card className="bg-white border-0 shadow-none ring-1 ring-black/5 rounded-2xl">
        <PageHeader
          titleMain="Arrest"
          titleAccent="Log"
          enableSearch={false}
          addLabel="Log Arrest"
          addTo="/app/arrests/log"
        />

        <CardContent>
          <ArrestList
            items={items}
            loading={loading}
            currency="USD"
            onEdit={handleEdit}
            canEdit={canEdit}
            onDelete={handleDelete}
            canDelete={canEdit}
          />
        </CardContent>
      </Card>

      <DeleteArrestModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        arrest={arrestToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
