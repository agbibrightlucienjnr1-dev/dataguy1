import { useQuery } from "@tanstack/react-query";
import { bundlesApi } from "../api";
import { queryKeys } from "../lib";

/**
 * Hook to get all bundles (authenticated)
 * @param {Object} params - { network?, page?, limit? }
 */
export function useBundles(params = {}) {
  return useQuery({
    queryKey: queryKeys.bundles.list(params),
    queryFn: () => bundlesApi.getAll(params),
    select: (response) => ({
      bundles: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Hook to get active bundles (public)
 */
export function useActiveBundles() {
  return useQuery({
    queryKey: queryKeys.bundles.active,
    queryFn: bundlesApi.getActive,
    select: (response) => response.data,
  });
}

/**
 * Hook to get bundle by ID
 * @param {string} id - Bundle ID
 */
export function useBundle(id) {
  return useQuery({
    queryKey: queryKeys.bundles.detail(id),
    queryFn: () => bundlesApi.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Hook to get seller info from payment link code
 * @param {string} code - Payment link code
 */
export function useSellerInfo(code) {
  return useQuery({
    queryKey: queryKeys.bundles.sellerInfo(code),
    queryFn: () => bundlesApi.getSellerInfo(code),
    select: (response) => response.data,
    enabled: !!code,
    retry: false,
  });
}

/**
 * Hook to get bundles for payment link page
 * @param {string} code - Payment link code
 */
export function usePaymentLinkBundles(code) {
  return useQuery({
    queryKey: queryKeys.bundles.byPaymentLink(code),
    queryFn: () => bundlesApi.getByPaymentLink(code),
    select: (response) => response.data,
    enabled: !!code,
    retry: false,
  });
}
