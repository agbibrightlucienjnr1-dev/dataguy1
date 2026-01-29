import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  Save,
  RefreshCw,
  Wifi,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { Card, Button, Input, Badge } from "../../components/ui";
import { pricingApi } from "../../api";
import { formatCurrency } from "../../utils/formatters";
import { NETWORKS } from "../../utils/constants";
import { useAuthStore } from "../../stores";
import toast from "react-hot-toast";

export default function AgentPricingPage() {
  const { user } = useAuthStore();
  const isAgent = user?.role === "agent";
  const queryClient = useQueryClient();
  const [editedPrices, setEditedPrices] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch bundles with pricing
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["myPricingBundles", isAgent],
    queryFn: () =>
      isAgent ? pricingApi.getAgentBundles() : pricingApi.getSubAgentBundles(),
  });

  const bundles = data?.data?.bundles || [];

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const prices = Object.entries(editedPrices).map(([bundleId, prices]) => ({
        bundleId,
        customerPrice: parseFloat(prices.customerPrice),
        ...(isAgent && prices.subAgentPrice !== undefined
          ? { subAgentPrice: parseFloat(prices.subAgentPrice) }
          : {}),
      }));

      if (isAgent) {
        return pricingApi.bulkSetAgentPrices(prices);
      } else {
        return pricingApi.bulkSetSubAgentPrices(prices);
      }
    },
    onSuccess: () => {
      toast.success("Prices saved successfully");
      setEditedPrices({});
      setHasChanges(false);
      queryClient.invalidateQueries(["myPricingBundles"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to save prices");
    },
  });

  // Handle price change
  const handlePriceChange = (bundleId, field, value) => {
    setEditedPrices((prev) => ({
      ...prev,
      [bundleId]: {
        ...prev[bundleId],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  // Get current price for a bundle
  const getCurrentPrice = (bundle, field) => {
    if (editedPrices[bundle.id]?.[field] !== undefined) {
      return editedPrices[bundle.id][field];
    }
    if (field === "customerPrice") {
      // For agents: default to adminPrice. For sub-agents: default to agentPrice (parent's sub-agent price)
      const defaultPrice = isAgent
        ? bundle.adminPrice
        : bundle.agentPrice || bundle.adminPrice;
      return bundle.customerPrice || defaultPrice || "";
    }
    if (field === "subAgentPrice") {
      return bundle.subAgentPrice || bundle.adminPrice || "";
    }
    return "";
  };

  // Get cost price for a bundle (what the agent/sub-agent pays)
  const getCostPrice = (bundle) => {
    if (isAgent) {
      return parseFloat(bundle.adminPrice);
    }
    // Sub-agent pays the parent agent's sub-agent price
    return parseFloat(bundle.agentPrice || bundle.adminPrice);
  };

  // Validate price
  const validatePrice = (bundle, field, value) => {
    const numValue = parseFloat(value);
    const costPrice = getCostPrice(bundle);

    if (isNaN(numValue) || numValue <= 0) {
      return { valid: false, message: "Price must be greater than 0" };
    }

    if (numValue < costPrice) {
      return {
        valid: false,
        message: `Cannot be less than cost (${formatCurrency(costPrice)})`,
      };
    }

    if (field === "subAgentPrice" && isAgent) {
      const customerPrice = parseFloat(
        getCurrentPrice(bundle, "customerPrice"),
      );
      if (numValue > customerPrice) {
        return { valid: false, message: "Cannot exceed customer price" };
      }
    }

    return { valid: true };
  };

  // Group bundles by network
  const bundlesByNetwork = bundles.reduce((acc, bundle) => {
    if (!bundle.isActive) return acc;
    if (!acc[bundle.network]) {
      acc[bundle.network] = [];
    }
    acc[bundle.network].push(bundle);
    return acc;
  }, {});

  const getNetworkData = (network) => {
    return (
      NETWORKS.find((n) => n.value === network) || {
        label: network,
        color: "bg-slate-500",
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Pricing</h1>
          <p className="text-slate-600 mt-1">
            Set your selling prices for data bundles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {hasChanges && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Pricing Rules:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>
                Customer price must be equal to or higher than your cost price
              </li>
              {isAgent && (
                <li>
                  Sub-agent price must be between your cost and customer price
                </li>
              )}
              <li>Your profit = Customer Price - Your Cost</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Pricing Table */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          Loading bundles...
        </div>
      ) : Object.keys(bundlesByNetwork).length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No bundles available for pricing</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(bundlesByNetwork).map(([network, networkBundles]) => {
            const networkData = getNetworkData(network);
            return (
              <Card key={network} className="overflow-hidden">
                {/* Network Header */}
                <div
                  className={`${networkData.color} text-white px-4 py-3 flex items-center gap-3`}
                >
                  <Wifi className="w-5 h-5" />
                  <span className="font-semibold">{networkData.label}</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {networkBundles.length} bundles
                  </Badge>
                </div>

                {/* Pricing Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left p-4 text-sm font-medium text-slate-600">
                          Bundle
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-slate-600">
                          Your Cost
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-slate-600">
                          Customer Price
                        </th>
                        {isAgent && (
                          <th className="text-left p-4 text-sm font-medium text-slate-600">
                            Sub-Agent Price
                          </th>
                        )}
                        <th className="text-left p-4 text-sm font-medium text-slate-600">
                          Your Profit
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-slate-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {networkBundles.map((bundle) => {
                        const costPrice = getCostPrice(bundle);
                        const customerPrice = parseFloat(
                          getCurrentPrice(bundle, "customerPrice"),
                        );
                        const profit = customerPrice - costPrice;
                        const customerValidation = validatePrice(
                          bundle,
                          "customerPrice",
                          getCurrentPrice(bundle, "customerPrice"),
                        );
                        const subAgentValidation = isAgent
                          ? validatePrice(
                              bundle,
                              "subAgentPrice",
                              getCurrentPrice(bundle, "subAgentPrice"),
                            )
                          : { valid: true };

                        const hasError =
                          !customerValidation.valid ||
                          !subAgentValidation.valid;
                        const isEdited = !!editedPrices[bundle.id];

                        return (
                          <tr
                            key={bundle.id}
                            className={`border-b border-slate-50 ${
                              hasError ? "bg-red-50" : ""
                            }`}
                          >
                            <td className="p-4">
                              <span className="font-medium text-slate-900">
                                {bundle.volume}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-slate-600">
                                {formatCurrency(costPrice)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="max-w-[120px]">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={costPrice}
                                  value={getCurrentPrice(
                                    bundle,
                                    "customerPrice",
                                  )}
                                  onChange={(e) =>
                                    handlePriceChange(
                                      bundle.id,
                                      "customerPrice",
                                      e.target.value,
                                    )
                                  }
                                  className={
                                    !customerValidation.valid
                                      ? "border-red-300 focus:border-red-500"
                                      : ""
                                  }
                                />
                                {!customerValidation.valid && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {customerValidation.message}
                                  </p>
                                )}
                              </div>
                            </td>
                            {isAgent && (
                              <td className="p-4">
                                <div className="max-w-[120px]">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={costPrice}
                                    max={customerPrice}
                                    value={getCurrentPrice(
                                      bundle,
                                      "subAgentPrice",
                                    )}
                                    onChange={(e) =>
                                      handlePriceChange(
                                        bundle.id,
                                        "subAgentPrice",
                                        e.target.value,
                                      )
                                    }
                                    className={
                                      !subAgentValidation.valid
                                        ? "border-red-300 focus:border-red-500"
                                        : ""
                                    }
                                  />
                                  {!subAgentValidation.valid && (
                                    <p className="text-xs text-red-600 mt-1">
                                      {subAgentValidation.message}
                                    </p>
                                  )}
                                </div>
                              </td>
                            )}
                            <td className="p-4">
                              <span
                                className={`font-medium ${
                                  profit > 0
                                    ? "text-green-600"
                                    : profit < 0
                                      ? "text-red-600"
                                      : "text-slate-600"
                                }`}
                              >
                                {profit > 0 ? "+" : ""}
                                {formatCurrency(profit)}
                              </span>
                            </td>
                            <td className="p-4">
                              {hasError ? (
                                <Badge variant="danger" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Error
                                </Badge>
                              ) : isEdited ? (
                                <Badge variant="warning" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Unsaved
                                </Badge>
                              ) : (
                                <Badge variant="success" className="gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Saved
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Save Button Fixed at Bottom on Mobile */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <Button
            className="w-full shadow-lg"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
