import api from "./api";

export const fetchPosts = () => api.get("/posts");
export const createPost = (data) => api.post("/posts", data);
export const likePost = (id) => api.post(`/posts/${id}/like`);
