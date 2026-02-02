import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Wifi,
  Users,
  ShoppingCart,
} from "lucide-react";
import { Card, Button, Input, Badge } from "../../components/ui";
import { pricingApi } from "../../api";
import { formatCurrency } from "../../utils/formatters";
import { NETWORKS } from "../../utils/constants";
import { useAuthStore } from "../../stores";
import toast from "react-hot-toast";

export default function AgentBundlesPage() {
  const [networkFilter, setNetworkFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuthStore();
  const isAgent = user?.role === "agent";

  // Fetch bundles with pricing - use different endpoint based on role
  const { data, isLoading } = useQuery({
    queryKey: ["myBundles", isAgent],
    queryFn: () =>
      isAgent ? pricingApi.getAgentBundles() : pricingApi.getSubAgentBundles(),
  });

  const bundles = data?.data?.bundles || [];

  // Filter bundles
  const filteredBundles = bundles.filter((bundle) => {
    const matchesNetwork = !networkFilter || bundle.network === networkFilter;
    const matchesSearch =
      !searchQuery ||
      bundle.volume.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesNetwork && matchesSearch;
  });

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

  // Group by network
  const bundlesByNetwork = filteredBundles.reduce((acc, bundle) => {
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

  // Generate payment link for customers
  const paymentLink = user?.paymentLinkCode
    ? `${window.location.origin}/buy/${user.paymentLinkCode}`
    : null;

  // Generate sub-agent registration link
  const subAgentRegistrationLink = user?.paymentLinkCode
    ? `${window.location.origin}/register/${user.paymentLinkCode}`
    : null;

  const copyPaymentLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      toast.success("Payment link copied!");
    }
  };

  const copySubAgentLink = () => {
    if (subAgentRegistrationLink) {
      navigator.clipboard.writeText(subAgentRegistrationLink);
      toast.success("Sub-agent registration link copied!");
    }
  };

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Bundles</h1>
          <p className="text-slate-600 mt-1">
            Available bundles and your selling prices
          </p>
        </div>

        {/* Links Section - Only show for agents */}
        {isAgent && (paymentLink || subAgentRegistrationLink) && (
          <div className="flex flex-col gap-3">
            {/* Customer Payment Link */}
            {paymentLink && (
              <Card className="bg-linear-to-r from-slate-900 to-slate-800 text-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  <p className="text-xs text-slate-300 font-medium">
                    Customer Payment Link
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm truncate max-w-50 flex-1">
                    {paymentLink}
                  </span>
                  <button
                    onClick={copyPaymentLink}
                    className="p-1.5 bg-white/10 rounded hover:bg-white/20"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/10 rounded hover:bg-white/20"
                    title="Open"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card>
            )}

            {/* Sub-Agent Registration Link */}
            {subAgentRegistrationLink && (
              <Card className="bg-linear-to-r from-blue-900 to-blue-800 text-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <p className="text-xs text-blue-300 font-medium">
                    Sub-Agent Registration Link
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm truncate max-w-50 flex-1">
                    {subAgentRegistrationLink}
                  </span>
                  <button
                    onClick={copySubAgentLink}
                    className="p-1.5 bg-white/10 rounded hover:bg-white/20"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={subAgentRegistrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/10 rounded hover:bg-white/20"
                    title="Open"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-blue-300 mt-2">
                  Share this link to recruit sub-agents under you
                </p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search bundles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">All Networks</option>
              {NETWORKS.map((network) => (
                <option key={network.value} value={network.value}>
                  {network.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Bundles Display */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          Loading bundles...
        </div>
      ) : Object.keys(bundlesByNetwork).length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No bundles available</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(bundlesByNetwork).map(([network, networkBundles]) => {
            const networkData = getNetworkData(network);
            return (
              <div key={network}>
                {/* Network Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 ${networkData.color} rounded-xl flex items-center justify-center`}
                  >
                    <Wifi className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {networkData.label}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {networkBundles.length} bundle
                      {networkBundles.length !== 1 ? "s" : ""} available
                    </p>
                  </div>
                </div>

                {/* Bundles Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {networkBundles.map((bundle) => {
                    const hasCustomPrice = bundle.customerPrice !== undefined;
                    const sellingPrice = hasCustomPrice
                      ? bundle.customerPrice
                      : bundle.adminPrice;
                    const costPrice = isAgent
                      ? bundle.adminPrice
                      : bundle.agentPrice || bundle.adminPrice;
                    const profit =
                      parseFloat(sellingPrice) - parseFloat(costPrice);

                    return (
                      <Card
                        key={bundle.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900 mb-1">
                            {bundle.volume}
                          </p>
                          <p className="text-xl font-semibold text-slate-900">
                            {formatCurrency(sellingPrice)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            selling price
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Your cost:</span>
                            <span className="text-slate-700">
                              {formatCurrency(costPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Profit:</span>
                            <span
                              className={
                                profit > 0
                                  ? "text-green-600 font-medium"
                                  : "text-slate-700"
                              }
                            >
                              {profit > 0 ? "+" : ""}
                              {formatCurrency(profit)}
                            </span>
                          </div>
                        </div>

                        {!hasCustomPrice && (
                          <Badge
                            variant="secondary"
                            className="mt-3 w-full justify-center"
                          >
                            Default pricing
                          </Badge>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900">How it works</h4>
            <p className="text-sm text-blue-700 mt-1">
              Share your payment link with customers. When they purchase a
              bundle, the data is delivered instantly to their phone, and your
              commission is credited to your wallet.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
