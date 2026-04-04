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
import { Card, Button, Input, Badge, EmptyState, SkeletonTable } from "../../components/ui";
import { pricingApi } from "../../api";
import { formatCurrency } from "../../utils/formatters";
import { NETWORKS } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";
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
      toast.error(
        getErrorMessage(
          error,
          "Unable to save prices. Please ensure all prices are valid.",
        ),
      );
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

  // Helper function to parse volume string to number (e.g., "1GB" -> 1, "500MB" -> 0.5)
  const parseVolume = (volume) => {
    const match = volume.match(/^([\d.]+)\s*(GB|MB|TB)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "MB") return value / 1000; // Convert MB to GB
    if (unit === "TB") return value * 1000; // Convert TB to GB
    return value; // Already in GB
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

  // Sort bundles by volume (smallest to largest) within each network
  Object.keys(bundlesByNetwork).forEach((network) => {
    bundlesByNetwork[network].sort((a, b) => {
      const volumeA = parseVolume(a.volume);
      const volumeB = parseVolume(b.volume);
      return volumeA - volumeB;
    });
  });

  const getNetworkData = (network) => {
    return (
      NETWORKS.find((n) => n.value === network) || {
        label: network,
        color: "bg-slate-500",
      }
    );
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Pricing</h1>
          <p className="text-slate-600 mt-1">
            Set your selling prices for data bundles
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-full sm:w-auto"
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
              className="w-full sm:w-auto hidden sm:flex"
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
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Pricing Rules:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li className="leading-relaxed">
                Customer price must be equal to or higher than your cost price
              </li>
              {isAgent && (
                <li className="leading-relaxed">
                  Sub-agent price must be between your cost and customer price
                </li>
              )}
              <li className="leading-relaxed">
                Your profit = Customer Price - Your Cost
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Pricing Table */}
      {isLoading ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                 <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Bundle</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Your Cost</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Customer Price</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Status</th>
                 </tr>
               </thead>
               <tbody>
                 <tr>
                   <td colSpan={6} className="p-4">
                     <SkeletonTable rows={5} columns={isAgent ? 6 : 5} />
                   </td>
                 </tr>
               </tbody>
            </table>
          </div>
        </Card>
      ) : Object.keys(bundlesByNetwork).length === 0 ? (
        <Card className="p-8">
           <EmptyState
              icon={Tag}
              title="No bundles found"
              description="There are currently no active data bundles available for you to set pricing on."
           />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(bundlesByNetwork).map(([network, networkBundles]) => {
            const networkData = getNetworkData(network);
            return (
              <Card key={network} className="overflow-hidden">
                {/* Network Header */}
                <div
                  className={`${networkData.color} text-white px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3`}
                >
                  <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-base sm:text-lg font-semibold">
                    {networkData.label}
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white text-xs"
                  >
                    {networkBundles.length}{" "}
                    {networkBundles.length === 1 ? "bundle" : "bundles"}
                  </Badge>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
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
                              <div className="max-w-30">
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
                                  placeholder="Enter price"
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
                                <div className="max-w-30">
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
                                    placeholder="Enter price"
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

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-slate-100">
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
                      !customerValidation.valid || !subAgentValidation.valid;
                    const isEdited = !!editedPrices[bundle.id];

                    return (
                      <div
                        key={bundle.id}
                        className={`p-4 ${hasError ? "bg-red-50" : ""}`}
                      >
                        {/* Bundle Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-slate-900 text-lg">
                              {bundle.volume}
                            </h4>
                            <p className="text-sm text-slate-600">
                              Cost: {formatCurrency(costPrice)}
                            </p>
                          </div>
                          <div>
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
                          </div>
                        </div>

                        {/* Pricing Inputs */}
                        <div className="space-y-4">
                          {/* Customer Price */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Customer Price
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min={costPrice}
                              value={getCurrentPrice(bundle, "customerPrice")}
                              onChange={(e) =>
                                handlePriceChange(
                                  bundle.id,
                                  "customerPrice",
                                  e.target.value,
                                )
                              }
                              className={`text-base ${
                                !customerValidation.valid
                                  ? "border-red-300 focus:border-red-500"
                                  : ""
                              }`}
                              placeholder="Enter customer price"
                            />
                            {!customerValidation.valid && (
                              <p className="text-xs text-red-600 mt-1">
                                {customerValidation.message}
                              </p>
                            )}
                          </div>

                          {/* Sub-Agent Price (Agents Only) */}
                          {isAgent && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Sub-Agent Price
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min={costPrice}
                                max={customerPrice}
                                value={getCurrentPrice(bundle, "subAgentPrice")}
                                onChange={(e) =>
                                  handlePriceChange(
                                    bundle.id,
                                    "subAgentPrice",
                                    e.target.value,
                                  )
                                }
                                className={`text-base ${
                                  !subAgentValidation.valid
                                    ? "border-red-300 focus:border-red-500"
                                    : ""
                                }`}
                                placeholder="Enter sub-agent price"
                              />
                              {!subAgentValidation.valid && (
                                <p className="text-xs text-red-600 mt-1">
                                  {subAgentValidation.message}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Profit Display */}
                          <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">
                                Your Profit
                              </span>
                              <span
                                className={`text-lg font-semibold ${
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
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Save Button Fixed at Bottom on Mobile */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 sm:hidden z-10 shadow-lg">
          <Button
            className="w-full"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
