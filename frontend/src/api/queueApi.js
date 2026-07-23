import api from "./client";

export const getQueuesRequest = (params = {}) => api.get("/queues", { params });
export const createQueueRequest = (payload) => api.post("/queues", payload);
export const getQueueRequest = (queueId) => api.get(`/queues/${queueId}`);
export const archiveQueueRequest = (queueId) => api.patch(`/queues/${queueId}/archive`);
export const unarchiveQueueRequest = (queueId) => api.patch(`/queues/${queueId}/unarchive`);
export const deleteQueueRequest = (queueId) => api.delete(`/queues/${queueId}`);
