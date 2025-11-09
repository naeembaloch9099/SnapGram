import api from "./api";

export const login = (credentials) => api.post("/auth/login", credentials);
export const signup = (data) => api.post("/auth/signup", data);
export const logout = () => Promise.resolve();
