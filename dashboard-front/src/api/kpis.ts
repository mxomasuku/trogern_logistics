import { http } from "../lib/http-instance"
import type { ApiResponse, DriverKpiResult } from "../types/types";

export async function getDriverKpis(driverId: String, vehicleId: String): Promise<DriverKpiResult> {

    const {data} = await http.get<ApiResponse<DriverKpiResult>>(`/drivers/get/kpis/${driverId}/${vehicleId}`)
    if(!data?.isSuccessful) throw new Error(data?.error?.message ?? "Failed to get driver kpi")
        return data.data! 

}