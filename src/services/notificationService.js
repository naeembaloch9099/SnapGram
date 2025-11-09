import api from "./api";

export const fetchNotifications = (unreadOnly = false) =>
  api.get("/notifications", { params: { unreadOnly } });
export const markAllNotificationsRead = () => api.post("/notifications/read");
export const deleteNotification = (notificationId) =>
  api.delete(`/notifications/${notificationId}`);
