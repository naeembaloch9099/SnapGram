import api from "./api";

export const fetchConversations = () => api.get("/messages");

// Make sure this 'sendMessage' function is exported
export const sendMessage = (conversationId, payload) => {
  // If payload contains a File under `file`, send multipart/form-data
  if (payload && payload.file instanceof File) {
    const fd = new FormData();
    if (payload.text) fd.append("text", payload.text);
    if (payload.media) fd.append("media", payload.media);
    if (payload.fileName) fd.append("fileName", payload.fileName);
    fd.append("file", payload.file);
    return api.post(`/messages/${conversationId}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // This is what our system messages will use
  return api.post(`/messages/${conversationId}`, payload);
};
