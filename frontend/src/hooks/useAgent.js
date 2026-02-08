import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agentApi } from "../api";
import toast from "react-hot-toast";
import { queryKeys } from "../lib";

/**
 * Hook to update shop name
 */
export function useUpdateShopName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shopName) => agentApi.updateShopName(shopName),
    onSuccess: () => {
      toast.success("Shop name updated successfully");
      // Invalidate profile and auth queries to refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to update shop name";
      toast.error(message);
    },
  });
}
