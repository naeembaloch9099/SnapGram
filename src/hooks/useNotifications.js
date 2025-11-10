import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "../services/notificationService";

export function useNotificationsData(unreadOnly = false, options = {}) {
  return useQuery({
    queryKey: ["notifications", { unreadOnly }],
    queryFn: () => fetchNotifications(unreadOnly).then((r) => r.data),
    staleTime: 1000 * 60 * 1,
    cacheTime: 1000 * 60 * 5,
    ...options,
  });
}
