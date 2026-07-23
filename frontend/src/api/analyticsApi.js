import api from "./client";

export const analyticsSummaryRequest = (queueId) => api.get(`/queues/${queueId}/analytics/summary`);
export const analyticsTrendRequest = (queueId) => api.get(`/queues/${queueId}/analytics/trend`);
export const analyticsStatusRequest = (queueId) => api.get(`/queues/${queueId}/analytics/status-distribution`);
export const analyticsHourlyRequest = (queueId) => api.get(`/queues/${queueId}/analytics/hourly-traffic`);
