import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wifi,
  Phone,
  User,
  ShoppingCart,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Package,
} from "lucide-react";
import { Card, Button, Input, Badge } from "../../components/ui";
import { useSellerInfo, usePaymentLinkBundles } from "../../hooks";
import { useCreateOrder } from "../../hooks";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";

// Validation schema
const purchaseSchema = z.object({
  customerPhone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^0[235]\d{8}$/,
      "Enter a valid Ghana phone number (e.g., 0241234567)",
    ),
  customerName: z.string().optional(),
});

const NETWORK_STYLES = {
  MTN: {
    bg: "bg-yellow-500",
    bgLight: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    gradient: "from-yellow-400 to-yellow-600",
  },
  AIRTELTIGO: {
    bg: "bg-red-500",
    bgLight: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    gradient: "from-red-400 to-red-600",
  },
};

export default function BuyPage() {
  const { code } = useParams();
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [networkFilter, setNetworkFilter] = useState("");

  // Fetch seller info
  const {
    data: sellerData,
    isLoading: sellerLoading,
    error: sellerError,
  } = useSellerInfo(code);

  // Fetch bundles
  const {
    data: bundlesData,
    isLoading: bundlesLoading,
    error: bundlesError,
  } = usePaymentLinkBundles(code);

  // Create order mutation
  const createOrder = useCreateOrder();

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      customerPhone: "",
      customerName: "",
    },
  });

  const seller = sellerData?.seller;

  // Backend returns bundles grouped by network: { MTN: [...], AIRTELTIGO: [...] }
  // Flatten it to an array and memoize
  const bundles = useMemo(() => {
    const groupedBundles = bundlesData?.bundles || {};
    // If it's already an array, return it
    if (Array.isArray(groupedBundles)) return groupedBundles;
    // If it's an object (grouped), flatten it
    return Object.values(groupedBundles).flat();
  }, [bundlesData]);

  // Filter bundles by network
  const filteredBundles = useMemo(() => {
    if (!networkFilter) return bundles;
    return bundles.filter((b) => b.network === networkFilter);
  }, [bundles, networkFilter]);

  // Group bundles by network
  const bundlesByNetwork = useMemo(() => {
    return filteredBundles.reduce((acc, bundle) => {
      if (!acc[bundle.network]) {
        acc[bundle.network] = [];
      }
      acc[bundle.network].push(bundle);
      return acc;
    }, {});
  }, [filteredBundles]);

  // Get unique networks
  const networks = useMemo(() => {
    return [...new Set(bundles.map((b) => b.network))];
  }, [bundles]);

  // Handle purchase
  const onSubmit = (data) => {
    if (!selectedBundle) {
      toast.error("Please select a data bundle");
      return;
    }

    createOrder.mutate({
      code,
      data: {
        bundleId: selectedBundle.id,
        customerPhone: data.customerPhone,
        customerName: data.customerName || undefined,
      },
    });
  };

  const isLoading = sellerLoading || bundlesLoading;
  const hasError = sellerError || bundlesError;

  // Error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Invalid Payment Link
          </h1>
          <p className="text-slate-600 mb-6">
            This payment link is invalid or has expired. Please contact the
            seller for a valid link.
          </p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-slate-900">
              DataGuy
            </Link>
            <Link
              to="/track"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Track Order
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Seller Info */}
        <Card className="p-6 mb-6 bg-linear-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-300 text-sm">Buying from</p>
              <h2 className="text-xl font-semibold">{seller?.name}</h2>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bundle Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Network Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={networkFilter === "" ? "primary" : "outline"}
                size="sm"
                onClick={() => setNetworkFilter("")}
              >
                All Networks
              </Button>
              {networks.map((network) => {
                const style = NETWORK_STYLES[network] || NETWORK_STYLES.MTN;
                return (
                  <Button
                    key={network}
                    variant={networkFilter === network ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setNetworkFilter(network)}
                    className={networkFilter === network ? style.bg : ""}
                  >
                    {network}
                  </Button>
                );
              })}
            </div>

            {/* Bundles Grid */}
            {Object.entries(bundlesByNetwork).map(
              ([network, networkBundles]) => {
                const style = NETWORK_STYLES[network] || NETWORK_STYLES.MTN;
                return (
                  <div key={network}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${style.bg}`} />
                      <h3 className="font-semibold text-slate-900">
                        {network}
                      </h3>
                      <Badge variant="secondary" size="sm">
                        {networkBundles.length} bundles
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {networkBundles.map((bundle) => {
                        const isSelected = selectedBundle?.id === bundle.id;
                        return (
                          <button
                            key={bundle.id}
                            onClick={() => setSelectedBundle(bundle)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? `${style.border} ${style.bgLight} ring-2 ring-offset-2 ring-${network === "MTN" ? "yellow" : "red"}-500`
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Wifi className={`w-4 h-4 ${style.text}`} />
                              {isSelected && (
                                <CheckCircle
                                  className={`w-4 h-4 ${style.text}`}
                                />
                              )}
                            </div>
                            <p className="font-bold text-slate-900 text-lg">
                              {bundle.volume}
                            </p>
                            <p className="text-slate-500 text-sm mb-2">
                              {bundle.validity}
                            </p>
                            <p className={`font-bold text-lg ${style.text}`}>
                              {formatCurrency(bundle.price)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              },
            )}

            {bundles.length === 0 && (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No bundles available</p>
              </Card>
            )}
          </div>

          {/* Order Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Complete Your Purchase
              </h3>

              {/* Selected Bundle Summary */}
              {selectedBundle ? (
                <div className="p-4 bg-slate-50 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Selected:</span>
                    <Badge
                      className={
                        NETWORK_STYLES[selectedBundle.network]?.bg ||
                        "bg-slate-500"
                      }
                    >
                      {selectedBundle.network}
                    </Badge>
                  </div>
                  <p className="font-bold text-lg text-slate-900">
                    {selectedBundle.volume}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {selectedBundle.validity}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total:</span>
                      <span className="font-bold text-lg text-slate-900">
                        {formatCurrency(selectedBundle.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg mb-4 text-center">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Select a bundle to continue
                  </p>
                </div>
              )}

              {/* Customer Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Phone Number"
                  placeholder="0241234567"
                  icon={Phone}
                  error={errors.customerPhone?.message}
                  {...register("customerPhone")}
                />

                <Input
                  label="Your Name (Optional)"
                  placeholder="John Doe"
                  icon={User}
                  {...register("customerName")}
                />

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={!selectedBundle || createOrder.isPending}
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Pay{" "}
                      {selectedBundle
                        ? formatCurrency(selectedBundle.price)
                        : ""}
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  You will be redirected to Paystack to complete payment
                </p>
              </form>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            Powered by{" "}
            <Link to="/" className="font-medium text-slate-900 hover:underline">
              DataGuy
            </Link>{" "}
            - Instant data bundles for Ghana
          </p>
        </div>
      </footer>
    </div>
  );
}
