import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Package,
  Plus,
  ToggleLeft,
  ToggleRight,
  Filter,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, Badge, Button, Modal, Input, EmptyState, SkeletonCard } from "../../components/ui";
import { bundlesApi, adminApi } from "../../api";
import { formatCurrency } from "../../utils/formatters";
import { NETWORKS } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

// Validation schema for bundle form
const bundleSchema = z.object({
  network: z.string().min(1, "Network is required"),
  volume: z.string().min(1, "Volume is required (e.g., 1GB, 2GB)"),
  hubnetCost: z
    .string()
    .min(1, "Hubnet cost is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Must be a valid positive number",
    }),
  adminPrice: z
    .string()
    .min(1, "Admin price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Must be a valid positive number",
    }),
});

export default function AdminBundlesPage() {
  const [networkFilter, setNetworkFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      network: "",
      volume: "",
      hubnetCost: "",
      adminPrice: "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors },
  } = useForm({
    resolver: zodResolver(
      z.object({
        hubnetCost: z
          .string()
          .min(1, "Hubnet cost is required")
          .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Must be a valid positive number",
          }),
        adminPrice: z
          .string()
          .min(1, "Admin price is required")
          .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Must be a valid positive number",
          }),
      }),
    ),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["bundles", { network: networkFilter, includeInactive: true }],
    queryFn: () =>
      bundlesApi.getAll({
        network: networkFilter || undefined,
        includeInactive: true,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createBundle(data),
    onSuccess: () => {
      toast.success("Bundle created successfully");
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      setShowAddModal(false);
      reset();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Unable to create bundle. Please check the details and try again.",
        ),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateBundle(id, data),
    onSuccess: () => {
      toast.success("Bundle updated successfully");
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      setShowEditModal(false);
      setSelectedBundle(null);
      resetEdit();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Unable to update bundle. Please try again."),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteBundle(id),
    onSuccess: () => {
      toast.success("Bundle deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      setShowDeleteModal(false);
      setSelectedBundle(null);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Unable to delete bundle. It may be in use by active orders.",
        ),
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      adminApi.toggleBundleStatus(id, !isActive),
    onSuccess: (data) => {
      toast.success(data?.message || "Bundle status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update bundle status");
    },
  });

  const bundles = data?.data?.bundles || [];
  const totalBundles = data?.data?.count || bundles.length;

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

  // Sort bundles by volume (smallest to largest)
  const sortedBundles = [...bundles].sort((a, b) => {
    const volumeA = parseVolume(a.volume);
    const volumeB = parseVolume(b.volume);
    return volumeA - volumeB;
  });

  const onSubmitAdd = (formData) => {
    createMutation.mutate({
      network: formData.network,
      volume: formData.volume.toUpperCase(),
      hubnetCost: parseFloat(formData.hubnetCost),
      adminPrice: parseFloat(formData.adminPrice),
    });
  };

  const onSubmitEdit = (formData) => {
    if (!selectedBundle) return;
    updateMutation.mutate({
      id: selectedBundle.id,
      data: {
        hubnetCost: parseFloat(formData.hubnetCost),
        adminPrice: parseFloat(formData.adminPrice),
      },
    });
  };

  const openEditModal = (bundle) => {
    setSelectedBundle(bundle);
    setEditValue("hubnetCost", bundle.hubnetCost?.toString() || "");
    setEditValue("adminPrice", bundle.adminPrice?.toString() || "");
    setShowEditModal(true);
  };

  const openDeleteModal = (bundle) => {
    setSelectedBundle(bundle);
    setShowDeleteModal(true);
  };

  const getNetworkBadge = (network) => {
    switch (network) {
      case "MTN":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
            MTN
          </span>
        );
      case "TELECEL":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
            Telecel
          </span>
        );
      case "AT":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            AT iSHARE
          </span>
        );
      case "AIRTELTIGO":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            Big Time
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded">
            {network}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Bundles</h1>
          <p className="text-slate-600 mt-1">
            Manage data bundles and their pricing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            <Package className="w-4 h-4 inline mr-1" />
            {totalBundles} bundles
          </span>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Bundle
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Filter by Network:</span>
          </div>
          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          >
            <option value="">All Networks</option>
            {NETWORKS.map((network) => (
              <option key={network.value} value={network.value}>
                {network.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Bundles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} className="h-62.5" />
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon="package"
            title="No bundles found"
            description="You haven't added any data bundles yet."
            action={{
              label: "Add Your First Bundle",
              onClick: () => setShowAddModal(true),
            }}
          />
        </Card>
      ) : (
        <div className="space-y-10">
          {["MTN", "TELECEL", "AT", "AIRTELTIGO"].map((networkKey) => {
            const networkBundles = sortedBundles.filter((b) => b.network === networkKey);
            if (networkBundles.length === 0) return null;

            const networkConfig = NETWORKS.find((n) => n.value === networkKey) || {
              label: networkKey,
              color: "bg-slate-500",
              textColor: "text-slate-700",
            };

            return (
              <div key={networkKey} className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                  <span className={`w-3.5 h-3.5 rounded-full ${
                    networkKey === "MTN"
                      ? "bg-yellow-400"
                      : networkKey === "TELECEL"
                      ? "bg-red-500"
                      : "bg-blue-600"
                  }`} />
                  <h2 className="text-lg font-bold text-slate-800">
                    {networkConfig.label} Bundles
                  </h2>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {networkBundles.length} {networkBundles.length === 1 ? "bundle" : "bundles"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {networkBundles.map((bundle) => (
                    <Card
                      key={bundle.id}
                      className={`p-0 overflow-hidden flex flex-col h-full ${!bundle.isActive ? "opacity-60" : ""}`}
                    >
                      <div
                        className={`h-2 w-full ${
                          bundle.network === "MTN"
                            ? "bg-yellow-400"
                            : bundle.network === "TELECEL"
                            ? "bg-red-500"
                            : bundle.network === "AT" || bundle.network === "AIRTELTIGO"
                            ? "bg-blue-600"
                            : "bg-slate-300"
                        }`}
                      />
                      <div className="p-5 flex flex-col grow">
                        <div className="flex items-start justify-between mb-3">
                          {getNetworkBadge(bundle.network)}
                          <div className="flex items-center gap-1">
                            {bundle.isActive ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-1">
                          {bundle.volume}
                        </h3>
                        <p className="text-slate-500 text-sm mb-4">
                          Validity: {bundle.validity || "30 days"}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Hubnet Cost:</span>
                            <span className="font-medium text-slate-900">
                              {formatCurrency(bundle.hubnetCost)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Admin Price:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(bundle.adminPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-3 mt-3">
                            <span className="text-slate-700 font-medium tracking-tight">Profit Margin:</span>
                            <span className="font-bold text-indigo-600 text-lg">
                              {formatCurrency(
                                parseFloat(bundle.adminPrice || 0) -
                                  parseFloat(bundle.hubnetCost || 0),
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openEditModal(bundle)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-red-600 hover:bg-red-50"
                              onClick={() => openDeleteModal(bundle)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                          <Button
                            variant={bundle.isActive ? "secondary" : "primary"}
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              toggleMutation.mutate({
                                id: bundle.id,
                                isActive: bundle.isActive,
                              })
                            }
                            disabled={toggleMutation.isPending}
                          >
                            {bundle.isActive ? (
                              <>
                                <ToggleLeft className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Fallback for other networks */}
          {sortedBundles.filter((b) => !["MTN", "TELECEL", "AT", "AIRTELTIGO"].includes(b.network)).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-400" />
                <h2 className="text-lg font-bold text-slate-800">Other Networks</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedBundles.filter((b) => !["MTN", "TELECEL", "AT", "AIRTELTIGO"].includes(b.network)).map((bundle) => (
                  <Card
                    key={bundle.id}
                    className={`p-0 overflow-hidden flex flex-col h-full ${!bundle.isActive ? "opacity-60" : ""}`}
                  >
                    <div className="h-2 w-full bg-slate-300" />
                    <div className="p-5 flex flex-col grow">
                      <div className="flex items-start justify-between mb-3">
                        {getNetworkBadge(bundle.network)}
                        <div className="flex items-center gap-1">
                          {bundle.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-1">{bundle.volume}</h3>
                      <p className="text-slate-500 text-sm mb-4">Validity: {bundle.validity || "30 days"}</p>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hubnet Cost:</span>
                          <span className="font-medium text-slate-900">{formatCurrency(bundle.hubnetCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Admin Price:</span>
                          <span className="font-medium text-green-600">{formatCurrency(bundle.adminPrice)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-3 mt-3">
                          <span className="text-slate-700 font-medium tracking-tight">Profit Margin:</span>
                          <span className="font-bold text-indigo-600 text-lg">
                            {formatCurrency(parseFloat(bundle.adminPrice || 0) - parseFloat(bundle.hubnetCost || 0))}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(bundle)}>
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => openDeleteModal(bundle)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                        <Button
                          variant={bundle.isActive ? "secondary" : "primary"}
                          size="sm"
                          className="w-full"
                          onClick={() => toggleMutation.mutate({ id: bundle.id, isActive: bundle.isActive })}
                          disabled={toggleMutation.isPending}
                        >
                          {bundle.isActive ? (
                            <><ToggleLeft className="w-4 h-4 mr-2" /> Deactivate</>
                          ) : (
                            <><ToggleRight className="w-4 h-4 mr-2" /> Activate</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Bundle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          reset();
        }}
        title="Add New Data Bundle"
      >
        <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Network
            </label>
            <select
              {...register("network")}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              <option value="">Select Network</option>
              {NETWORKS.map((network) => (
                <option key={network.value} value={network.value}>
                  {network.label}
                </option>
              ))}
            </select>
            {errors.network && (
              <p className="text-sm text-red-600 mt-1">
                {errors.network.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Volume
            </label>
            <Input
              {...register("volume")}
              placeholder="e.g., 1GB, 2GB, 5GB, 10GB"
              error={errors.volume?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hubnet Cost (GHS)
            </label>
            <Input
              {...register("hubnetCost")}
              type="number"
              step="0.01"
              placeholder="Cost from Hubnet"
              error={errors.hubnetCost?.message}
            />
            <p className="text-xs text-slate-500 mt-1">
              The price you pay to Hubnet for this bundle
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Admin Price (GHS)
            </label>
            <Input
              {...register("adminPrice")}
              type="number"
              step="0.01"
              placeholder="Price for agents"
              error={errors.adminPrice?.message}
            />
            <p className="text-xs text-slate-500 mt-1">
              The price agents will pay for this bundle
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Bundle"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Bundle Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBundle(null);
          resetEdit();
        }}
        title="Edit Data Bundle"
      >
        {selectedBundle && (
          <form onSubmit={handleEditSubmit(onSubmitEdit)} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                {getNetworkBadge(selectedBundle.network)}
                <span className="font-semibold text-lg">
                  {selectedBundle.volume}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Editing prices for this bundle
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hubnet Cost (GHS)
              </label>
              <Input
                {...registerEdit("hubnetCost")}
                type="number"
                step="0.01"
                placeholder="Cost from Hubnet"
                error={editErrors.hubnetCost?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Admin Price (GHS)
              </label>
              <Input
                {...registerEdit("adminPrice")}
                type="number"
                step="0.01"
                placeholder="Price for agents"
                error={editErrors.adminPrice?.message}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBundle(null);
                  resetEdit();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBundle(null);
        }}
        title="Delete Bundle"
      >
        {selectedBundle && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                Are you sure you want to delete this bundle? This action cannot
                be undone.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getNetworkBadge(selectedBundle.network)}
                <span className="font-semibold">{selectedBundle.volume}</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Hubnet Cost: {formatCurrency(selectedBundle.hubnetCost)} • Admin
                Price: {formatCurrency(selectedBundle.adminPrice)}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedBundle(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                onClick={() => deleteMutation.mutate(selectedBundle.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Bundle"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
