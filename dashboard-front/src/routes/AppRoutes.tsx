import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Protected from "@/components/Protected";
import LoginPage from "@/features/auth/LoginPage";
import DriversPage from "@/features/drivers/DriversPage";
import VehiclesPage from "@/features/vehicles/VehiclesPage";
import ServicePage from "@/features/service/ServicePage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="login" element={<LoginPage />} />

      {/* Layout + protected area */}
      <Route path="/" element={<AppLayout />}>
        {/* index == "/" */}
        <Route index element={<Navigate to="drivers" replace />} />

        {/* child paths are RELATIVE here (no leading slash) */}
        <Route
          path="drivers"
          element={<Protected><DriversPage /></Protected>}
        />
        <Route
          path="vehicles"
          element={<Protected><VehiclesPage /></Protected>}
        />
        <Route
          path="service"
          element={<Protected><ServicePage /></Protected>}
        />

        {/* 404 fallback inside layout */}
        <Route path="*" element={<Navigate to="drivers" replace />} />
      </Route>
    </Routes>
  );
}