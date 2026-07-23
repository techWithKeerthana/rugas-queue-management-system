import api from "./client";

export const getQueuesRequest = (params = {}) => api.get("/queues", { params });
export const createQueueRequest = (payload) => api.post("/queues", payload);
export const getQueueRequest = (queueId) => api.get(`/queues/${queueId}`);
export const archiveQueueRequest = (queueId) => api.patch(`/queues/${queueId}/archive`);
export const unarchiveQueueRequest = (queueId) => api.patch(`/queues/${queueId}/unarchive`);
export const addQueueCounterRequest = (queueId, payload) => api.post(`/queues/${queueId}/counters`, payload);
export const renameQueueCounterRequest = (queueId, counterId, payload) =>
	api.patch(`/queues/${queueId}/counters/${counterId}`, payload);
export const removeQueueCounterRequest = (queueId, counterId) => api.delete(`/queues/${queueId}/counters/${counterId}`);
export const deleteQueueRequest = (queueId) => api.delete(`/queues/${queueId}`);
