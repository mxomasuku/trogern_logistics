import { http } from "../lib/http-instance"
import type { ApiResponse, DriverKpiResult, VehicleKpiResponse, MileageTrendsResponse } from "../types/types";

export async function getDriverKpis(driverId: string, vehicleId: string): Promise<DriverKpiResult> {

    const {data} = await http.get<ApiResponse<DriverKpiResult>>(`/drivers/get/kpis/${driverId}/${vehicleId}`)
    if(!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to get driver kpi")
        return data.data! 

}


export async function getDriverMileageTrends(driverId: string, vehicleId: string): Promise<MileageTrendsResponse> {
  const { data } = await http.get<ApiResponse<MileageTrendsResponse>>(
    `/drivers/get/mileage-trends/${driverId}/${vehicleId}`
  );
  if (!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to get mileage trends");
  return data.data!;
}


export async function getVehicleKpis(id: string): Promise<VehicleKpiResponse> {
  const { data } = await http.get<ApiResponse<VehicleKpiResponse>>(
    `vehicles/get-vehicle-kpis/${id}`
  );

  if (!data?.isSuccessful) {
    throw new Error(data?.error?.message ?? "Failed to get vehicle KPI");
  }


  return data.data!;
}

