import api from "./client";

export const registerRequest = (payload) => api.post("/auth/register", payload);
export const loginRequest = (payload) => api.post("/auth/login", payload);
export const meRequest = () => api.get("/auth/me");
