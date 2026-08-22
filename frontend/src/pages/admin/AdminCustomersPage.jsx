import { useState, useMemo } from "react";
import { useCustomers } from "../../hooks/useCustomers";
import { customersApi, adminApi } from "../../api";
import toast from "react-hot-toast";
import { Card, Input, EmptyState, SkeletonTable, Modal, Button, Reveal } from "../../components/ui";
import { formatDate } from "../../utils/formatters";
import { Search, Download, User, Phone, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminCustomersPage() {
  const { data, isLoading, isError, refetch } = useCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const customers = data?.customers || [];

  const handleExport = async () => {
    try {
      const response = await customersApi.exportCustomers();
      const filename = `customers-admin-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(response, filename);
      toast.success("Customers export downloaded");
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Customer export failed. Please try again.");
    }
  };

  const handleImportSubmit = async (e) => {
    e?.preventDefault();
    if (!importText.trim()) return;

    const rawPhones = importText.split(/[\s,]+/);
    setIsImporting(true);
    
    try {
      const result = await adminApi.addCustomers(rawPhones);
      toast.success(result.message || `Successfully imported customers`);
      setIsImportModalOpen(false);
      setImportText("");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add customers. Ensure valid input.");
    } finally {
      setIsImporting(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowerSearch = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(lowerSearch)) ||
        (c.phone && c.phone.includes(lowerSearch)),
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600 mt-1">
            View all customers and order activity across the platform.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            icon={Search}
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64"
          />
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-action-600 text-white px-4 py-2 text-sm font-medium hover:bg-action-700 transition shadow-sm shadow-emerald-200 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customers</span>
          </button>
          <button
            onClick={handleExport}
            className="shimmer-sweep flex items-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition shadow-sm shadow-brand-200"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <Reveal>
      <Card className="overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={4} />
          </div>
        ) : isError ? (
          <EmptyState
            icon="error"
            title="Could not load customers"
            description="We encountered an issue while fetching the customers. Please refresh the page."
          />
        ) : customers.length === 0 ? (
          <EmptyState
            icon="empty"
            title="No customers yet"
            description="No customers have placed orders on the platform yet."
          />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matches found"
            description={`No customer matches the search "${searchTerm}". Try a different name or phone number.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-brand-50/60 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Phone Number</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Total Orders</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Successful</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedCustomers.map((customer) => (
                  <tr
                    key={customer.phone}
                    className="hover:bg-brand-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {customer.name ? customer.name.charAt(0) : <User className="w-4 h-4" />}
                        </div>
                        <div className="font-medium text-slate-900 border-none">
                          {customer.name || <span className="text-slate-400 italic">Unknown Name</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {customer.totalOrdersCount ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {customer.successfulOrdersCount ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {customer.lastOrderAt
                        ? formatDate(customer.lastOrderAt)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      </Reveal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Add USSD-Eligible Customers"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isImporting}
              disabled={!importText.trim()}
              onClick={handleImportSubmit}
            >
              Import Customers
            </Button>
          </>
        }
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <p className="text-sm text-slate-600">
            Paste phone numbers separated by spaces, commas, or new lines. They will automatically bypass the USSD web-order block.
          </p>
          <textarea
            className="w-full h-32 rounded-xl border border-slate-200 p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="0241234567, 0557654321..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
