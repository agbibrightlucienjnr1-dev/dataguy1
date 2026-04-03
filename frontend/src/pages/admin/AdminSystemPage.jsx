import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  HardDrive,
  Cpu,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
  Server,
  FileText,
} from "lucide-react";
import { Card } from "../../components/ui";
import { Button } from "../../components/ui";
import { Spinner } from "../../components/ui";
import { adminApi } from "../../api";
import toast from "react-hot-toast";

export default function AdminSystemPage() {
  const queryClient = useQueryClient();
  const [cleanupConfig, setCleanupConfig] = useState({
    archiveOrdersDays: 90,
    cleanupTransactionsDays: 180,
    hardDeleteOrders: false,
    optimize: true,
  });

  // Fetch database stats
  const {
    data: dbStats,
    isLoading: dbStatsLoading,
    refetch: refetchDbStats,
  } = useQuery({
    queryKey: ["admin", "database-stats"],
    queryFn: () => adminApi.getDatabaseStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch memory stats
  const {
    data: memoryStats,
    isLoading: memoryStatsLoading,
    refetch: refetchMemoryStats,
  } = useQuery({
    queryKey: ["admin", "memory-stats"],
    queryFn: () => adminApi.getMemoryStats(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: (data) => adminApi.runDatabaseCleanup(data),
    onSuccess: (data) => {
      toast.success("Database cleanup completed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "database-stats"] });
      refetchDbStats();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to run database cleanup"
      );
    },
  });

  // Optimize mutation
  const optimizeMutation = useMutation({
    mutationFn: () => adminApi.optimizeDatabase(),
    onSuccess: () => {
      toast.success("Database optimization completed");
      queryClient.invalidateQueries({ queryKey: ["admin", "database-stats"] });
      refetchDbStats();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to optimize database"
      );
    },
  });

  // Cache stats
  const {
    data: cacheStatsData,
    isLoading: cacheStatsLoading,
    refetch: refetchCacheStats,
  } = useQuery({
    queryKey: ["admin", "cache-stats"],
    queryFn: () => adminApi.getCacheStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: () => adminApi.clearCache(),
    onSuccess: () => {
      toast.success("Cache cleared successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "cache-stats"] });
      refetchCacheStats();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to clear cache"
      );
    },
  });

  const handleCleanup = () => {
    if (
      !window.confirm(
        "Are you sure you want to run database cleanup? This action cannot be undone."
      )
    ) {
      return;
    }

    cleanupMutation.mutate(cleanupConfig);
  };

  const handleOptimize = () => {
    if (
      !window.confirm(
        "Are you sure you want to optimize the database? This may take a few minutes."
      )
    ) {
      return;
    }

    optimizeMutation.mutate();
  };

  const dbData = dbStats?.data || {};
  const memoryData = memoryStats?.data || {};
  const memoryStatus = memoryStats?.status || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Management</h1>
        <p className="text-slate-600 mt-1">
          Monitor database size, memory usage, and perform maintenance tasks
        </p>
      </div>

      {/* Memory Statistics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Memory Usage
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchMemoryStats()}
            disabled={memoryStatsLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                memoryStatsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        {memoryStatsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-500 mb-1">Process RSS</div>
              <div className="text-xl font-bold text-slate-900">
                {memoryData.formatted?.rss || "N/A"}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-500 mb-1">Heap Used</div>
              <div className="text-xl font-bold text-slate-900">
                {memoryData.formatted?.heapUsed || "N/A"}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-500 mb-1">Heap Total</div>
              <div className="text-xl font-bold text-slate-900">
                {memoryData.formatted?.heapTotal || "N/A"}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg flex flex-col justify-between">
              <div>
                <div className="text-sm text-slate-500 mb-1">System Usage</div>
                <div className="text-xl font-bold text-slate-900 mb-2">
                  {memoryData.formatted?.systemUsagePercent || "N/A"}
                </div>
              </div>
              <div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      memoryStatus.isHigh?.system ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${parseFloat(memoryData.formatted?.systemUsagePercent || "0")}%`,
                    }}
                  />
                </div>
                {memoryStatus.isHigh?.system && (
                  <div className="mt-1 flex items-center gap-1 text-red-600 text-xs font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    High Usage Alert
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {memoryStatus.warnings && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                {memoryStatus.warnings.process && (
                  <div>{memoryStatus.warnings.process}</div>
                )}
                {memoryStatus.warnings.system && (
                  <div>{memoryStatus.warnings.system}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Database Statistics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Database Statistics
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchDbStats()}
            disabled={dbStatsLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                dbStatsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        {dbStatsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Database Size */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Total Database Size
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-900">
                  {dbData.database?.database_size || "N/A"}
                </span>
              </div>
            </div>

            {/* Row Counts */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Users</div>
                <div className="text-lg font-bold text-slate-900">
                  {dbData.rowCounts?.users?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Orders</div>
                <div className="text-lg font-bold text-slate-900">
                  {dbData.rowCounts?.orders?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Transactions</div>
                <div className="text-lg font-bold text-slate-900">
                  {dbData.rowCounts?.walletTransactions?.toLocaleString() ||
                    0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Withdrawals</div>
                <div className="text-lg font-bold text-slate-900">
                  {dbData.rowCounts?.withdrawals?.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Bundles</div>
                <div className="text-lg font-bold text-slate-900">
                  {dbData.rowCounts?.dataBundles?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* Table Sizes */}
            {dbData.tables && dbData.tables.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Table Sizes
                </h3>
                <div className="space-y-2">
                  {dbData.tables.map((table, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm"
                    >
                      <span className="text-slate-700 font-mono">
                        {table.tablename}
                      </span>
                      <span className="text-slate-900 font-medium">
                        {table.size}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Cache Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Cache Management
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchCacheStats()}
            disabled={cacheStatsLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                cacheStatsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Monitor and manage application cache to improve performance.
        </p>

        {cacheStatsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Total Entries</div>
                <div className="text-lg font-bold text-slate-900">
                  {cacheStatsData?.data?.total || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Active</div>
                <div className="text-lg font-bold text-green-600">
                  {cacheStatsData?.data?.active || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Expired</div>
                <div className="text-lg font-bold text-slate-600">
                  {cacheStatsData?.data?.expired || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <div className="text-xs text-slate-500 mb-1">Memory Usage</div>
                <div className="text-lg font-bold text-slate-900">
                  {cacheStatsData?.data?.memoryUsage || "0 MB"}
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to clear all cache? This may temporarily increase database load."
                  )
                ) {
                  clearCacheMutation.mutate();
                }
              }}
              variant="outline"
              className="w-full"
              disabled={clearCacheMutation.isPending}
            >
              {clearCacheMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Cache
                </>
              )}
            </Button>
          </>
        )}
      </Card>

      {/* Database Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cleanup */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Database Cleanup
            </h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Remove old orders and transactions to free up database space.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Archive Orders Older Than (days)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={cleanupConfig.archiveOrdersDays}
                onChange={(e) =>
                  setCleanupConfig({
                    ...cleanupConfig,
                    archiveOrdersDays: parseInt(e.target.value) || 90,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Clean Transactions Older Than (days)
              </label>
              <input
                type="number"
                min="60"
                max="730"
                value={cleanupConfig.cleanupTransactionsDays}
                onChange={(e) =>
                  setCleanupConfig({
                    ...cleanupConfig,
                    cleanupTransactionsDays: parseInt(e.target.value) || 180,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hardDelete"
                checked={cleanupConfig.hardDeleteOrders}
                onChange={(e) =>
                  setCleanupConfig({
                    ...cleanupConfig,
                    hardDeleteOrders: e.target.checked,
                  })
                }
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900/10"
              />
              <label htmlFor="hardDelete" className="text-sm text-slate-700">
                Permanently delete orders (not recommended)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="optimize"
                checked={cleanupConfig.optimize}
                onChange={(e) =>
                  setCleanupConfig({
                    ...cleanupConfig,
                    optimize: e.target.checked,
                  })
                }
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900/10"
              />
              <label htmlFor="optimize" className="text-sm text-slate-700">
                Run database optimization after cleanup
              </label>
            </div>

            <Button
              onClick={handleCleanup}
              disabled={cleanupMutation.isPending}
              className="w-full"
              variant="destructive"
            >
              {cleanupMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Running Cleanup...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Run Cleanup
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Optimize */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Database Optimization
            </h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Run PostgreSQL VACUUM to reclaim space and update statistics. This
            may take a few minutes.
          </p>

          <Button
            onClick={handleOptimize}
            disabled={optimizeMutation.isPending}
            className="w-full"
            variant="default"
          >
            {optimizeMutation.isPending ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Optimizing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Optimize Database
              </>
            )}
          </Button>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                Optimization helps improve query performance and reclaim unused
                space.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
