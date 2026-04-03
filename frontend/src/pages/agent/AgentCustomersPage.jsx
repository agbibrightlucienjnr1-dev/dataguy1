import { useState, useMemo } from "react";
import { useCustomers } from "../../hooks/useCustomers";
import { customersApi } from "../../api";
import toast from "react-hot-toast";
import { Card, Input, EmptyState, SkeletonTable } from "../../components/ui";
import { formatDate } from "../../utils/formatters";
import { Search, Download, User, Phone, CheckCircle, ShoppingBag } from "lucide-react";

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

export default function AgentCustomersPage() {
  const { data, isLoading, isError } = useCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  const customers = data?.customers || [];

  const handleExport = async () => {
    try {
      const response = await customersApi.exportCustomers();
      const filename = `customers-agent-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(response, filename);
      toast.success("Customers export downloaded");
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Customer export failed. Please try again.");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Customers</h1>
          <p className="text-slate-600 mt-1">
            View verified customers from your own sales.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            icon={Search}
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={5} columns={4} />
          </div>
        ) : isError ? (
          <EmptyState
            icon="error"
            title="Could not load customers"
            description="We encountered an issue while fetching your customers. Please refresh the page."
          />
        ) : customers.length === 0 ? (
          <EmptyState
            icon="empty"
            title="No customers yet"
            description="When people buy data bundles using your payment link, their details will appear here."
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
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Phone Number</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Total Orders</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Successful</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.phone}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
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
      </Card>
    </div>
  );
}
