// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";

import HomeLayout from "@/layouts/HomeLayout/HomeLayout";
import Protected from "@/components/Protected";

import  {RequireCompany}  from "@/pages/auth/RequireCompany";
import  {RequireNoCompany}  from "@/pages/auth/RequireCompany";


import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignUpPage from "@/pages/auth/Signup";
import CompanySetupPage from "@/pages/CompanySetupPage";

import Home from "@/pages/home/Home";
import DriversPage from "@/pages/drivers/DriversPage";
import AddDriver from "@/pages/drivers/pages/AddDriver";
import DriverProfile from "@/pages/drivers/pages/driver_profile/DriverProfile";

import VehiclesPage from "@/pages/vehicles/VehiclesPage";
import AddVehicle from "@/pages/vehicles/pages/AddVehicle";
import VehicleProfile from "@/pages/vehicles/pages/VehicleProfile";

import ServicePage from "@/pages/service/ServicePage";
import AddServicePage from "@/pages/service/page/AddService";
import ServiceRecordsPage from "@/pages/service/page/ServiceRecordsPage";

import IncomePage from "@/pages/income/IncomePage";
import AddIncomePage from "@/pages/income/pages/AddIncomePage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* ONBOARDING (requires login, must have NO company yet) */}
      <Route
        path="/onboarding/company"
        element={
          <Protected>
            <RequireNoCompany>
              <CompanySetupPage />
            </RequireNoCompany>
          </Protected>
        }
      />

      {/* APP AREA (requires login AND company exists) */}
      <Route
        path="/app"
        element={
          <Protected>
            <RequireCompany>
              <HomeLayout />
            </RequireCompany>
          </Protected>
        }
      >
        <Route path="home" element={<Home />} />

        <Route path="drivers" element={<DriversPage />} />
        <Route path="drivers/add" element={<AddDriver />} />
        <Route path="drivers/profile" element={<DriverProfile />} />

        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/add" element={<AddVehicle />} />
        <Route path="vehicles/profile" element={<VehicleProfile />} />

        <Route path="service" element={<ServicePage />} />
        <Route path="service/add" element={<AddServicePage />} />
        <Route path="service/records" element={<ServiceRecordsPage />} />

        <Route path="income" element={<IncomePage />} />
        <Route path="income/add" element={<AddIncomePage />} />
      </Route>
    </Routes>
  );
}