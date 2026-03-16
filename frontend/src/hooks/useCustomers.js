import { useQuery } from "@tanstack/react-query";
import { customersApi } from "../api";
import { queryKeys } from "../lib";

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.list,
    queryFn: customersApi.getCustomers,
    select: (response) => ({
      customers: response.customers || [],
      count: response.count || 0,
    }),
    staleTime: 2 * 60 * 1000,
  });
}
