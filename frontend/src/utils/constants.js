// ========== Networks ==========
export const NETWORKS = [
  {
    value: "MTN",
    label: "MTN",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
  },
  {
    value: "TELECEL",
    label: "Telecel",
    color: "bg-red-600",
    textColor: "text-red-700",
  },
  {
    value: "AT",
    label: "AT iSHARE",
    color: "bg-blue-600",
    textColor: "text-blue-700",
  },
  {
    value: "AIRTELTIGO",
    label: "AT Big Time",
    color: "bg-blue-600",
    textColor: "text-blue-700",
  },
];

export const MOBILE_MONEY_NETWORKS = ["MTN", "TELECEL", "AIRTELTIGO"];

export const NETWORK_PHONE_PREFIXES = {
  MTN: ["024", "054", "055", "059", "025", "053"],
  TELECEL: ["020", "050"],
  AIRTELTIGO: ["027", "057", "026", "056"],
  AT: ["027", "057", "026", "056"],
};

// ========== Order Statuses ==========
export const ORDER_STATUSES = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    description: "Awaiting payment",
  },
  payment_confirmed: {
    label: "Paid",
    color: "bg-blue-100 text-blue-800",
    description: "Payment confirmed",
  },
  processing: {
    label: "Processing",
    color: "bg-purple-100 text-purple-800",
    description: "Data bundle being delivered",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    description: "Successfully delivered",
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800",
    description: "Delivery failed",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
    description: "Order cancelled",
  },
};

// ========== Withdrawal Statuses ==========
export const WITHDRAWAL_STATUSES = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    description: "Awaiting approval",
  },
  approved: {
    label: "Approved",
    color: "bg-blue-100 text-blue-800",
    description: "Approved by admin",
  },
  processing: {
    label: "Processing",
    color: "bg-purple-100 text-purple-800",
    description: "Transfer in progress",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    description: "Successfully transferred",
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800",
    description: "Transfer failed",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    description: "Rejected by admin",
  },
};

// ========== Transaction Types ==========
export const TRANSACTION_TYPES = {
  commission: {
    label: "Commission",
    color: "bg-green-100 text-green-800",
    icon: "plus",
  },
  withdrawal: {
    label: "Withdrawal",
    color: "bg-red-100 text-red-800",
    icon: "minus",
  },
  refund: {
    label: "Refund",
    color: "bg-blue-100 text-blue-800",
    icon: "plus",
  },
  adjustment: {
    label: "Adjustment",
    color: "bg-gray-100 text-gray-800",
    icon: "edit",
  },
};

// ========== User Roles ==========
export const USER_ROLES = {
  admin: {
    label: "Admin",
    color: "bg-purple-100 text-purple-800",
  },
  agent: {
    label: "Agent",
    color: "bg-blue-100 text-blue-800",
  },
  sub_agent: {
    label: "Sub-Agent",
    color: "bg-green-100 text-green-800",
  },
};

// ========== Account Types ==========
export const ACCOUNT_TYPES = {
  bank_account: {
    label: "Bank Account",
    icon: "building",
  },
  mobile_money: {
    label: "Mobile Money",
    icon: "smartphone",
  },
};

// ========== Limits ==========
export const MIN_WITHDRAWAL_AMOUNT = 10.0;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ========== Routes ==========
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/buy",
  "/track",
  "/payment",
];
export const DASHBOARD_ROUTES = [
  "/dashboard",
  "/orders",
  "/wallet",
  "/withdrawals",
  "/pricing",
  "/profile",
];
export const ADMIN_ROUTES = ["/admin"];

// ========== App Info ==========
export const APP_NAME = import.meta.env.VITE_APP_NAME || "DataGuy";
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";
