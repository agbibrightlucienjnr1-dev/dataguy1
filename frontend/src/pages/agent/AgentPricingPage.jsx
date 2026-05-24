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
  const [selectedNetwork, setSelectedNetwork] = useState(null);

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
        ...(prices.customerPrice !== undefined ? { customerPrice: parseFloat(prices.customerPrice) } : {}),
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

  const handleBackToNetworks = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
      );
      if (!confirmLeave) return;
    }
    setEditedPrices({});
    setHasChanges(false);
    setSelectedNetwork(null);
  };

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

      {/* Pricing Table / Network Cards */}
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
      ) : !selectedNetwork ? (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto py-6">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Select a Mobile Network</h2>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">
              Choose a network to configure customer and sub-agent bundle pricing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {["MTN", "TELECEL", "AT", "AIRTELTIGO"].map((networkKey) => {
              const count = bundlesByNetwork[networkKey]?.length || 0;
              const networkInfo = getNetworkData(networkKey);
              
              // Custom gradient card styles matching the branding colors
              let cardGradient = "from-slate-500 to-slate-600 shadow-slate-100/50 hover:shadow-slate-200/80";
              let badgeColor = "bg-slate-100 text-slate-800";
              if (networkKey === "MTN") {
                cardGradient = "from-amber-400 to-yellow-500 shadow-yellow-100/50 hover:shadow-yellow-200/80";
                badgeColor = "bg-yellow-100 text-yellow-900";
              } else if (networkKey === "TELECEL") {
                cardGradient = "from-red-500 to-rose-600 shadow-red-100/50 hover:shadow-red-200/80";
                badgeColor = "bg-red-100 text-red-900";
              } else if (networkKey === "AT" || networkKey === "AIRTELTIGO") {
                cardGradient = "from-blue-500 to-indigo-600 shadow-blue-100/50 hover:shadow-blue-200/80";
                badgeColor = "bg-blue-100 text-blue-900";
              }

              return (
                <button
                  key={networkKey}
                  onClick={() => setSelectedNetwork(networkKey)}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cardGradient} p-6 text-white text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 h-44 flex flex-col justify-between`}
                >
                  {/* Absolute decoration */}
                  <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 transition-transform duration-500 group-hover:scale-110">
                    <Wifi className="w-36 h-36" />
                  </div>

                  <div className="flex items-center justify-between z-10">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <Wifi className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
                      {count} {count === 1 ? "bundle" : "bundles"}
                    </span>
                  </div>

                  <div className="z-10">
                    <h3 className="text-2xl font-bold tracking-tight">{networkInfo.label}</h3>
                    <p className="text-white/80 text-xs mt-1">Configure pricing & profit margins</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToNetworks}
              className="flex items-center gap-1.5"
            >
              ← Back to Networks
            </Button>
          </div>

          {(() => {
            const networkBundles = bundlesByNetwork[selectedNetwork] || [];
            const networkData = getNetworkData(selectedNetwork);

            if (networkBundles.length === 0) {
              return (
                <Card className="p-8">
                  <EmptyState
                    icon={Tag}
                    title="No active bundles"
                    description={`There are currently no active ${networkData.label} bundles available.`}
                  />
                </Card>
              );
            }

            return (
              <Card className="overflow-hidden">
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
          })()}
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
