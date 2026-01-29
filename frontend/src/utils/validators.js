import { z } from "zod";

// ========== Auth Schemas ==========

export const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+233|0)[0-9]{9}$/,
      "Please enter a valid Ghana phone number (e.g., 0241234567)",
    ),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^(\+233|0)[0-9]{9}$/,
        "Please enter a valid Ghana phone number (e.g., 0241234567)",
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ========== Order Schemas ==========

export const purchaseSchema = z.object({
  bundleId: z.string().min(1, "Please select a data bundle"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^0[0-9]{9}$/,
      "Enter a valid 10-digit phone number (e.g., 0241234567)",
    ),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

// ========== Withdrawal Schemas ==========

export const withdrawalSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: "Amount is required" })
      .min(10, "Minimum withdrawal is GH₵10.00"),
    accountType: z.enum(["bank_account", "mobile_money"], {
      required_error: "Please select account type",
    }),
    accountNumber: z
      .string()
      .min(1, "Account number is required")
      .min(5, "Please enter a valid account number"),
    accountName: z
      .string()
      .min(1, "Account name is required")
      .min(2, "Please enter a valid account name"),
    bankName: z.string().optional(),
    mobileNetwork: z.enum(["MTN", "VODAFONE", "AIRTELTIGO"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "bank_account" && !data.bankName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a bank",
        path: ["bankName"],
      });
    }
    if (data.accountType === "mobile_money" && !data.mobileNetwork) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a mobile network",
        path: ["mobileNetwork"],
      });
    }
  });

// ========== Pricing Schemas ==========

export const agentPriceSchema = z.object({
  customerPrice: z
    .number({ invalid_type_error: "Price is required" })
    .min(0.01, "Price must be greater than 0"),
  subAgentPrice: z
    .number({ invalid_type_error: "Sub-agent price is required" })
    .min(0.01, "Price must be greater than 0"),
});

export const subAgentPriceSchema = z.object({
  customerPrice: z
    .number({ invalid_type_error: "Price is required" })
    .min(0.01, "Price must be greater than 0"),
});

// ========== Admin Schemas ==========

export const rejectWithdrawalSchema = z.object({
  reason: z
    .string()
    .min(1, "Please provide a reason for rejection")
    .min(10, "Reason must be at least 10 characters"),
});

// ========== Helper for form validation ==========

export const getErrorMessage = (error) => {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return "An error occurred";
};
