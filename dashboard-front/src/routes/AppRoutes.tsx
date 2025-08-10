// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import HomeLayout from "@/layouts/HomeLayout/HomeLayout";
import Protected from "@/components/Protected";
import DriversPage from "@/pages/drivers/DriversPage";
import VehiclesPage from "@/pages/vehicles/VehiclesPage";
import ServicePage from "@/pages/service/ServicePage";
import LoginPage from "@/pages/auth/LoginPage";
import Home from "@/pages/home/Home";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeLayout />}>
        <Route path="home" element={<Protected><Home/></Protected>}/>
        <Route path="drivers" element={<Protected><DriversPage /></Protected>} />
        <Route path="vehicles" element={<Protected><VehiclesPage /></Protected>} />
        <Route path="service" element={<Protected><ServicePage /></Protected>} />
      </Route>
    </Routes>
  );
}