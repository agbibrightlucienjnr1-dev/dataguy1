import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ordersApi } from "../api";
import { queryKeys } from "../lib";

/**
 * Hook to get authenticated user's orders
 * @param {Object} params - { status?, network?, page?, limit? }
 */
export function useOrders(params = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => ordersApi.getMyOrders(params),
    select: (response) => ({
      orders: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Hook to get order by ID
 * @param {string} id - Order ID
 */
export function useOrder(id) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.getById(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}

/**
 * Hook to get order statistics
 */
export function useOrderStats() {
  return useQuery({
    queryKey: queryKeys.orders.stats,
    queryFn: ordersApi.getMyStats,
    select: (response) => response.data,
  });
}

/**
 * Hook to track order by ID (public)
 * @param {string} orderId - Order ID
 */
export function useTrackOrder(orderId) {
  return useQuery({
    queryKey: queryKeys.orders.track(orderId),
    queryFn: () => ordersApi.track(orderId),
    select: (response) => response.data,
    enabled: !!orderId,
    retry: false,
  });
}

/**
 * Hook to track orders by phone (public)
 * @param {string} phone - Phone number
 */
export function useTrackOrdersByPhone(phone) {
  return useQuery({
    queryKey: queryKeys.orders.trackByPhone(phone),
    queryFn: () => ordersApi.trackByPhone(phone),
    select: (response) => response.data,
    enabled: !!phone && phone.length >= 10,
    retry: false,
  });
}

/**
 * Hook to create order from payment link
 */
export function useCreateOrder() {
  return useMutation({
    mutationFn: ({ code, data }) => ordersApi.createFromLink(code, data),
    onSuccess: (response) => {
      // Redirect to Paystack payment page
      if (response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create order");
    },
  });
}
