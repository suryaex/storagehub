import { api, unwrap } from "./api";
import type { DashboardSummary } from "@/types";

export const dashboardService = {
  summary: () => unwrap<DashboardSummary>(api.get("/dashboard/summary")),
};
