import api from "./api";

export const fetchPosts = () => api.get("/posts");

// Create post: if `data` contains a File (or is FormData) use multipart/form-data
export const createPost = (data) => {
  // If caller passed FormData directly
  if (data instanceof FormData) {
    return api.post("/posts", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // If data has a `file` property that's a File, build FormData
  if (data && data.file instanceof File) {
    const fd = new FormData();
    if (data.caption) fd.append("caption", data.caption);
    if (data.type) fd.append("type", data.type);
    fd.append("file", data.file);
    return api.post("/posts", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // Default: send JSON body (legacy behavior)
  return api.post("/posts", data);
};

export const likePost = (id) => api.post(`/posts/${id}/like`);
