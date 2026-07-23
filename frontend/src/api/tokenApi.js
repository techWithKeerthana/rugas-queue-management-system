import api from "./client";

export const listTokensRequest = (queueId, params = {}) => api.get(`/queues/${queueId}/tokens`, { params });
export const addTokenRequest = (queueId, payload) => api.post(`/queues/${queueId}/tokens`, payload);
export const reorderTokensRequest = (queueId, payload) => api.patch(`/queues/${queueId}/tokens/reorder`, payload);
export const serveTopRequest = (queueId) => api.patch(`/queues/${queueId}/tokens/serve-top`);
export const completeTokenRequest = (queueId, tokenId) =>
  api.patch(`/queues/${queueId}/tokens/${tokenId}/complete`);
export const cancelTokenRequest = (queueId, tokenId) => api.patch(`/queues/${queueId}/tokens/${tokenId}/cancel`);
export const undoTokenRequest = (queueId, tokenId) => api.patch(`/queues/${queueId}/tokens/${tokenId}/undo`);
export const getPublicTrackRequest = (queueId, tokenId) => api.get(`/public/track/${queueId}/${tokenId}`);
export const joinPublicQueueRequest = (queueId, payload) => api.post(`/public/join/${queueId}`, payload);
