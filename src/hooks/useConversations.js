import { useQuery } from "@tanstack/react-query";
import { fetchConversations } from "../services/messageService";

export function useConversations(options = {}) {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConversations().then((r) => r.data),
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 10,
    ...options,
  });
}
