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
import { Card, Badge, Button, Modal, Input } from "../../components/ui";
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
      case "AirtelTigo":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
            AirtelTigo
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
        <div className="text-center py-12 text-slate-500">
          Loading bundles...
        </div>
      ) : bundles.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No bundles found</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Bundle
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bundles.map((bundle) => (
            <Card
              key={bundle.id}
              className={`p-4 ${!bundle.isActive ? "opacity-60" : ""}`}
            >
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
                <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                  <span className="text-slate-500">Profit Margin:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(
                      parseFloat(bundle.adminPrice || 0) -
                        parseFloat(bundle.hubnetCost || 0),
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
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
            </Card>
          ))}
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
