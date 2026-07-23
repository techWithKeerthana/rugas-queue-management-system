import api from "./client";

export const getQueuesRequest = () => api.get("/queues");
export const createQueueRequest = (payload) => api.post("/queues", payload);
export const getQueueRequest = (queueId) => api.get(`/queues/${queueId}`);
export const deleteQueueRequest = (queueId) => api.delete(`/queues/${queueId}`);
