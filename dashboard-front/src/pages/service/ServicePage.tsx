// src/pages/ServiceHubPage.tsx
'use client';

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListChecks, Wrench } from "lucide-react";
import { AddServiceItemModal } from "./components/AddServiceItemModal";

export default function ServiceHubPage() {
  const [openItemModal, setOpenItemModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service & Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {/* 1) Add Service (page) */}
          <Button
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate("/service/add")}
          >
            <Wrench className="h-5 w-5" />
            <span>Add Service</span>
          </Button>

          {/* 2) View Service Records (page) */}
          <Button
            variant="secondary"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate("/service/records")}
          >
            <ListChecks className="h-5 w-5" />
            <span>View Service Records</span>
          </Button>

          {/* 3) Add Service Item (modal) */}
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setOpenItemModal(true)}
          >
            <Plus className="h-5 w-5" />
            <span>Add Service Item</span>
          </Button>
        </CardContent>
      </Card>

      <AddServiceItemModal open={openItemModal} onOpenChange={setOpenItemModal} />
    </div>
  );
}