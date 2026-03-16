import { useCustomers } from "../../hooks/useCustomers";
import { customersApi } from "../../api";
import toast from "react-hot-toast";
import { Card } from "../../components/ui";
import { formatDate } from "../../utils/formatters";

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Customers</h1>
          <p className="text-slate-600 mt-1">
            View verified customers from your own sales.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:bg-slate-700 transition"
        >
          Export to Excel
        </button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">
            Loading customers...
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-500">
            Could not load customers. Please refresh.
          </div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No customers yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 font-semibold">Phone</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Total Orders</th>
                  <th className="px-3 py-2 font-semibold">Completed Orders</th>
                  <th className="px-3 py-2 font-semibold">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.phone}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 text-slate-800">
                      {customer.phone}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {customer.name || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      {customer.totalOrdersCount ?? 0}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      {customer.successfulOrdersCount ?? 0}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
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
