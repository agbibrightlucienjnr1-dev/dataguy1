import { useState, useMemo, useRef, useEffect } from "react";
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
  Lock,
} from "lucide-react";
import { Card, Button, Input, Badge } from "../../components/ui";
import { useSellerInfo, usePaymentLinkBundles } from "../../hooks";
import { useCreateOrder } from "../../hooks";
import { formatCurrency } from "../../utils/formatters";
import { NETWORK_PHONE_PREFIXES } from "../../utils/constants";
import { paymentsApi } from "../../api/payments";
import toast from "react-hot-toast";

// Validation schema
const purchaseSchema = z.object({
  customerPhone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^0\d{9}$/,
      "Enter a valid 10-digit phone number (e.g., 0241234567)",
    ),
  customerName: z.string().optional(),
});

// Normalize and detect network from phone prefix
const normalizePhone = (phone) => phone.trim().replace(/^\+233/, "0");

const getNetworkFromPhone = (phone) => {
  const normalized = normalizePhone(phone).replace(/\D/g, "");
  if (!normalized.startsWith("0") || normalized.length !== 10) {
    return null;
  }
  const prefix = normalized.slice(0, 3);

  for (const [network, prefixes] of Object.entries(NETWORK_PHONE_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return network;
    }
  }
  return null;
};

const NETWORK_STYLES = {
  MTN: {
    bg: "bg-yellow-500",
    bgLight: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    gradient: "from-yellow-400 to-yellow-600",
    ring: "ring-yellow-500/20",
  },
  TELECEL: {
    bg: "bg-red-600",
    bgLight: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    gradient: "from-red-500 to-red-700",
    ring: "ring-red-500/20",
  },
  AT: {
    bg: "bg-blue-600",
    bgLight: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-500 to-blue-700",
    ring: "ring-blue-500/20",
  },
  AIRTELTIGO: {
    bg: "bg-blue-600",
    bgLight: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-500 to-blue-700",
    ring: "ring-blue-500/20",
  },
};

export default function BuyPage() {
  const { code } = useParams();
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [networkFilter, setNetworkFilter] = useState("");
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [moolreReference, setMoolreReference] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState(null);
  const [paymentNetwork, setPaymentNetwork] = useState(null);
  const [pendingTotal, setPendingTotal] = useState(null);
  const formRef = useRef(null);

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

  // Auto-scroll to form on mobile when bundle is selected
  useEffect(() => {
    if (selectedBundle && formRef.current) {
      // Only auto-scroll on smaller screens (mobile/tablet)
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (isMobile) {
        // Small delay to ensure UI updates first
        setTimeout(() => {
          formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, [selectedBundle]);

  // Backend returns bundles grouped by network: { MTN: [...], AIRTELTIGO: [...] }
  // Flatten it to an array and memoize
  const bundles = useMemo(() => {
    const groupedBundles = bundlesData?.bundles || {};
    // If it's already an array, return it
    if (Array.isArray(groupedBundles)) return groupedBundles;
    // If it's an object (grouped), flatten it
    return Object.values(bundlesData?.bundles || {}).flat();
  }, [bundlesData]);

  const settings = bundlesData?.settings;

  // Calculate fees
  const { serviceFee, grandTotal } = useMemo(() => {
    if (!selectedBundle || !settings) return { serviceFee: 0, grandTotal: 0 };

    const provider = settings.activePaymentProvider;
    const price = Number(selectedBundle.price);
    let ourFee = 0;
    let moolreSurcharge = 0;

    if (provider === "moolre") {
      // 1. Our service fee: percentage of bundle price
      const percentage = Number(settings.moolreFeePercentage);
      ourFee = (percentage / 100) * price;

      // 2. Moolre's estimated surcharge (that they add automatically at the prompt)
      // Moolre charges 1% of the TOTAL amount we ask them to collect, minimum GHS 0.50
      const baseTotal = price + ourFee;
      moolreSurcharge = Math.max(baseTotal * 0.01, 0.5);
    } else {
      // Paystack: flat fee for small amounts, percentage for larger ones
      const flatFee = Number(settings.paystackFlatFee);
      const percentage = Number(settings.paystackFeePercentage);
      ourFee = price < 20 ? flatFee : (percentage / 100) * price;
    }

    // Combine both into one 'Service Fee' for UI transparency as requested
    const displayFee = ourFee + moolreSurcharge;

    return {
      serviceFee: displayFee,
      grandTotal: price + displayFee,
    };
  }, [selectedBundle, settings]);

  // Filter bundles by network
  const filteredBundles = useMemo(() => {
    if (!networkFilter) return bundles;
    return bundles.filter((b) => b.network === networkFilter);
  }, [bundles, networkFilter]);

  // Helper function to parse volume string to number (e.g., "1GB" -> 1, "500MB" -> 0.5)
  const parseVolume = (volume) => {
    if (!volume) return 0;
    const match = volume.toString().match(/([\d.]+)\s*(GB|MB|TB)/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "MB") return value / 1000; // Convert MB to GB
    if (unit === "TB") return value * 1000; // Convert TB to GB
    return value; // Already in GB
  };

  // Group bundles by network
  const bundlesByNetwork = useMemo(() => {
    const grouped = filteredBundles.reduce((acc, bundle) => {
      if (!acc[bundle.network]) {
        acc[bundle.network] = [];
      }
      acc[bundle.network].push(bundle);
      return acc;
    }, {});

    // Sort bundles by volume (smallest to largest) within each network
    Object.keys(grouped).forEach((network) => {
      grouped[network].sort((a, b) => {
        const volumeA = parseVolume(a.volume);
        const volumeB = parseVolume(b.volume);
        return volumeA - volumeB;
      });
    });

    return grouped;
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

    // Get payment phone and network
    const payPhone = normalizePhone(data.customerPhone);
    const inferredNetwork = getNetworkFromPhone(payPhone);
    const finalNetwork = inferredNetwork;

    if (!finalNetwork) {
      toast.error(
        "Could not detect network from the phone number. Please enter a valid Ghanaian phone number.",
      );
      return;
    }

    const isAirtelTigoMatch =
      (finalNetwork === "AIRTELTIGO" || finalNetwork === "AT") &&
      (selectedBundle.network === "AIRTELTIGO" || selectedBundle.network === "AT");

    if (finalNetwork !== selectedBundle.network && !isAirtelTigoMatch) {
      toast.error(
        `The selected bundle is for ${selectedBundle.network === "AIRTELTIGO" ? "Big Time" : selectedBundle.network === "AT" ? "AT iSHARE" : selectedBundle.network} but your number is ${finalNetwork === "AIRTELTIGO" ? "Big Time" : finalNetwork === "AT" ? "AT iSHARE" : finalNetwork}. Please enter a matching number.`,
      );
      return;
    }

    // Save for OTP usage
    setPaymentPhone(payPhone);
    setPaymentNetwork(finalNetwork);
    setPendingTotal(grandTotal);

    createOrder.mutate(
      {
        code,
        data: {
          bundleId: selectedBundle.id,
          customerPhone: normalizePhone(data.customerPhone),
          paymentNumber: payPhone,
          network: finalNetwork,
          customerName: data.customerName || undefined,
        },
      },
      {
        onSuccess: (response) => {
          const payment = response.data?.payment;
          if (payment?.otpRequired) {
            // TP14: OTP was sent — show OTP verification modal
            setMoolreReference(payment.reference);
            setOtpModalOpen(true);
          } else if (payment?.authorizationUrl) {
            // Paystack: redirect to payment page
            window.location.href = payment.authorizationUrl;
          } else if (payment?.success) {
            // Moolre direct prompt: payment prompt was sent to customer's phone directly (no OTP needed)
            toast.success(
              "Payment prompt sent to your phone. Please check your phone and enter your Mobile Money PIN.",
              { duration: 8000 },
            );
            setTimeout(() => {
              window.location.href = `/track?phone=${paymentPhone}`;
            }, 5000);
          }
        },
      },
    );
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return toast.error("Please enter the OTP");
    setVerifyingOtp(true);
    try {
      await paymentsApi.verifyMoolreOtp({
        reference: moolreReference,
        otpcode: otpCode,
        network: paymentNetwork,
        phone: paymentPhone,
      });
      toast.success(
        "OTP Verified! Check your phone for the Mobile Money PIN prompt.",
      );
      setOtpModalOpen(false);
      // Let them click Track Order implicitly or wait for redirect (Track Order is better for now)
      setTimeout(() => {
        window.location.href = `/track?phone=${paymentPhone}`;
      }, 5000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Animated Subtle Background */}
      <div className="absolute top-0 -left-64 w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none"></div>
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-linear-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center shadow-md transform group-hover:scale-105 transition-all">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-700">
                DataGuy
              </span>
            </Link>
            <Link
              to="/track"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200"
            >
              Track Order
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Seller Info Container */}
        <div className="p-8 mb-8 rounded-2xl bg-slate-900 shadow-2xl relative overflow-hidden border border-slate-800 animate-float-slow">
          <div className="absolute inset-0 bg-mesh-navy opacity-40"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-700 rounded-full mix-blend-screen filter blur-2xl opacity-40 pointer-events-none"></div>

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-1">
                Buying from
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {seller?.shopName || seller?.name}
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bundle Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Network Filter / Initial Selection Screen */}
            {networkFilter === "" ? (
              <div className="glass-panel p-8 rounded-3xl border border-white/50 space-y-6 bg-white/70 backdrop-blur-md shadow-lg">
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight text-center">
                  Select a Network/Bundle Type to view available packages
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {networks.map((network) => {
                    const style = NETWORK_STYLES[network] || NETWORK_STYLES.MTN;
                    const label = network === "AIRTELTIGO" ? "Big Time" : network === "AT" ? "AT iSHARE" : network === "TELECEL" ? "Telecel" : "MTN";
                    return (
                      <button
                        key={network}
                        onClick={() => setNetworkFilter(network)}
                        className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 hover:scale-102 hover:shadow-lg ${style.border} bg-white hover:${style.bgLight} flex flex-col items-center justify-center gap-3`}
                      >
                        <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center text-white shadow-md`}>
                          <Wifi className="w-6 h-6" />
                        </div>
                        <span className="font-extrabold text-lg text-slate-900">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap mb-6">
                  {networks.map((network) => {
                    const style = NETWORK_STYLES[network] || NETWORK_STYLES.MTN;
                    const isActive = networkFilter === network;
                    const label = network === "AIRTELTIGO" ? "Big Time" : network === "AT" ? "AT iSHARE" : network === "TELECEL" ? "Telecel" : "MTN";
                    return (
                      <Button
                        key={network}
                        variant={isActive ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setNetworkFilter(network)}
                        className={`transition-all rounded-full px-5 ${isActive ? `${style.bg} text-white border-transparent shadow-md` : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                      >
                        {label}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNetworkFilter("");
                      setSelectedBundle(null);
                    }}
                    className="transition-all rounded-full px-5 bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    Back to Selection
                  </Button>
                </div>

                {/* Bundles Grid */}
                {Object.entries(bundlesByNetwork).map(
                  ([network, networkBundles]) => {
                    const style = NETWORK_STYLES[network] || NETWORK_STYLES.MTN;
                    const label = network === "AIRTELTIGO" ? "Big Time" : network === "AT" ? "AT iSHARE" : network === "TELECEL" ? "Telecel" : "MTN";
                    return (
                      <div
                        key={network}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className={`w-4 h-4 rounded shadow-sm ${style.bg}`}
                          />
                          <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                            {label}
                          </h3>
                          <Badge
                            variant="secondary"
                            size="sm"
                            className="bg-slate-200 text-slate-700 ml-1"
                          >
                            {networkBundles.length} bundles
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {networkBundles.map((bundle) => {
                            const isSelected = selectedBundle?.id === bundle.id;
                            return (
                              <button
                                key={bundle.id}
                                onClick={() => setSelectedBundle(bundle)}
                                className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden group ${
                                  isSelected
                                    ? `${style.border} ${style.bgLight} ring-4 ring-offset-2 ${style.ring} shadow-lg -translate-y-1`
                                    : "border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                                }`}
                              >
                                {isSelected && (
                                  <div
                                    className={`absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45 ${style.bg} opacity-10`}
                                  ></div>
                                )}
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                  <Wifi
                                    className={`w-5 h-5 transition-colors ${isSelected ? style.text : "text-slate-400 group-hover:text-slate-600"}`}
                                  />
                                  {isSelected && (
                                    <CheckCircle
                                      className={`w-5 h-5 ${style.text} animate-in zoom-in duration-200`}
                                    />
                                  )}
                                </div>
                                <div className="relative z-10">
                                  <p
                                    className={`font-extrabold text-2xl transition-colors ${isSelected ? "text-slate-900" : "text-slate-800"}`}
                                  >
                                    {bundle.volume}
                                  </p>
                                  <p className="text-slate-500 text-sm font-medium mb-3">
                                    {bundle.validity || "30 days"}
                                  </p>
                                  <p
                                    className={`font-bold tracking-tight text-lg ${isSelected ? style.text : "text-slate-700"}`}
                                  >
                                    {formatCurrency(bundle.price)}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </>
            )}

            {bundles.length === 0 && (
              <div className="glass-panel p-12 rounded-3xl text-center border border-white/50">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  No bundles available
                </h3>
                <p className="text-slate-600">
                  This seller hasn't added any bundles yet.
                </p>
              </div>
            )}
          </div>

          {/* Order Form */}
          <div className="lg:col-span-1 border-slate-200">
            <div
              ref={formRef}
              className="glass-panel p-6 sm:p-8 rounded-3xl sticky top-28 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60"
            >
              <h3 className="font-bold text-xl text-slate-900 mb-6 tracking-tight">
                Complete Your Purchase
              </h3>

              {/* Selected Bundle Summary */}
              {selectedBundle ? (
                <div className="p-5 bg-white rounded-2xl mb-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${NETWORK_STYLES[selectedBundle.network]?.bg || "bg-slate-500"}`}
                  ></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Selected
                    </span>
                    <Badge
                      className={
                        NETWORK_STYLES[selectedBundle.network]?.bg ||
                        "bg-slate-500"
                      }
                    >
                      {selectedBundle.network === "AIRTELTIGO"
                        ? "Big Time"
                        : selectedBundle.network === "AT"
                        ? "AT iSHARE"
                        : selectedBundle.network === "TELECEL"
                        ? "Telecel"
                        : "MTN"}
                    </Badge>
                  </div>
                  <p className="font-extrabold text-2xl text-slate-900">
                    {selectedBundle.volume}
                  </p>
                  <p className="text-slate-500 text-sm font-medium mb-4">
                    {selectedBundle.validity}
                  </p>
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">
                        Bundle Price:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(selectedBundle.price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold">
                        Service Fee:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(serviceFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                      <span className="text-slate-900 font-bold">Total:</span>
                      <span className="font-extrabold text-2xl text-slate-900">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2xl mb-6 text-center border border-dashed border-slate-200/50">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Select a bundle to continue
                  </p>
                </div>
              )}

              {/* Customer Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                      type="tel"
                      placeholder="0241234567"
                      className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white/80 text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 hover:border-slate-300 ${errors.customerPhone ? "border-red-500" : "border-slate-200"}`}
                      {...register("customerPhone")}
                    />
                  </div>
                  {errors.customerPhone && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.customerPhone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Your Name (Optional)
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white/80 text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 hover:border-slate-300"
                      {...register("customerName")}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-[15px] font-bold shadow-slate-900/20 shadow-lg hover:-translate-y-0.5 transition-all bg-slate-900 hover:bg-slate-800 text-white border-0 mt-4"
                  disabled={!selectedBundle || createOrder.isPending}
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Pay {selectedBundle ? formatCurrency(grandTotal) : ""}
                    </>
                  )}
                </Button>

                <p className="text-xs font-semibold text-slate-500 text-center pt-2 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Secured by{" "}
                  {settings?.activePaymentProvider === "moolre"
                    ? "Moolre"
                    : "Paystack"}
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Register as Agent CTA */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center relative z-10">
        <div className="inline-block p-1 rounded-full bg-slate-100">
          <Link to={`/register/subagent?agent=${code}`}>
            <Button
              variant="outline"
              className="gap-2 rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-semibold px-6 py-2 h-auto shadow-sm transition-all hover:shadow-md"
            >
              <User className="w-4 h-4" />
              Become an Agent
            </Button>
          </Link>
        </div>
      </div>

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

      {/* Moolre OTP Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="max-w-sm w-full p-6 bg-white animate-in zoom-in-95">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-purple-600 mb-2">
              Payment Verification
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              An OTP has been sent to your phone. Enter it to authorize the
              payment of
              <span className="text-slate-900 font-bold ml-1">
                {formatCurrency(pendingTotal)}
              </span>
              .
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  OTP Code
                </label>
                <input
                  type="text"
                  placeholder="Enter 4-6 digit OTP"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white shadow-sm text-center text-lg tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12"
                  onClick={() => setOtpModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl h-12 bg-slate-900 text-white"
                  onClick={handleVerifyOtp}
                  disabled={!otpCode || verifyingOtp}
                >
                  {verifyingOtp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Verify & Pay"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
