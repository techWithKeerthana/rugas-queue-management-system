import api from "./client";

export const getActivityLogsRequest = (params = {}) => api.get("/activity-logs", { params });
