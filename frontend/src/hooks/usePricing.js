import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { pricingApi } from "../api";
import { queryKeys } from "../lib";

/**
 * Hook to set agent price for a bundle
 */
export function useSetAgentPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bundleId, data }) =>
      pricingApi.setAgentPrice(bundleId, data),
    onSuccess: () => {
      toast.success("Price updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.agent });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pricing.agentBundles,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update price");
    },
  });
}

/**
 * Hook to bulk set agent prices
 */
export function useBulkSetAgentPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pricingApi.bulkSetAgentPrices,
    onSuccess: () => {
      toast.success("Prices updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.agent });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pricing.agentBundles,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update prices");
    },
  });
}

/**
 * Hook to set sub-agent price for a bundle
 */
export function useSetSubAgentPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bundleId, data }) =>
      pricingApi.setSubAgentPrice(bundleId, data),
    onSuccess: () => {
      toast.success("Price updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.subAgent });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pricing.subAgentBundles,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update price");
    },
  });
}

/**
 * Hook to bulk set sub-agent prices
 */
export function useBulkSetSubAgentPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pricingApi.bulkSetSubAgentPrices,
    onSuccess: () => {
      toast.success("Prices updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.subAgent });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pricing.subAgentBundles,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update prices");
    },
  });
}
