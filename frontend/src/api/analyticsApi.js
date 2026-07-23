import api from "./client";

export const analyticsSummaryRequest = (queueId) => api.get(`/queues/${queueId}/analytics/summary`);
export const analyticsTrendRequest = (queueId) => api.get(`/queues/${queueId}/analytics/trend`);
export const analyticsStatusRequest = (queueId) => api.get(`/queues/${queueId}/analytics/status-distribution`);
export const analyticsHourlyRequest = (queueId) => api.get(`/queues/${queueId}/analytics/hourly-traffic`);
export const analyticsInsightsRequest = (queueId, params = {}) =>
	api.get(`/queues/${queueId}/analytics/insights`, { params });
export const analyticsReportRequest = (queueId, params) => api.get(`/queues/${queueId}/analytics/reports`, { params });

export const analyticsExportCsvRequest = (queueId, params) =>
	api.get(`/queues/${queueId}/analytics/reports/export.csv`, {
		params,
		responseType: "blob",
	});

export const analyticsExportPdfRequest = (queueId, params) =>
	api.get(`/queues/${queueId}/analytics/reports/export.pdf`, {
		params,
		responseType: "blob",
	});
