import { z } from "zod";

// ========== Auth Schemas ==========

export const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+233|0)[0-9]{9}$/,
      "Please enter a valid Ghana phone number starting with 0 or +233 (e.g., 0241234567)",
    ),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long (maximum 100 characters)"),
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address (e.g., yourname@example.com)")
      .max(255, "Email address is too long"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^(\+233|0)[0-9]{9}$/,
        "Please enter a valid Ghana phone number starting with 0 or +233 (e.g., 0241234567)",
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(12, "Password must be at least 12 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z)")
      .regex(/[0-9]/, "Password must contain at least one number (0-9)")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character (!@#$%^&*)",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please make sure both passwords are identical.",
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

// ========== Profile Schemas ==========

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(12, "Password must be at least 12 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// ========== Password Reset Schemas ==========

export const forgotPasswordSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+233|0)[0-9]{9}$/,
      "Please enter a valid Ghana phone number starting with 0 or +233 (e.g., 0241234567)",
    ),
});

export const passwordResetSchema = z
  .object({
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^(\+233|0)[0-9]{9}$/,
        "Please enter a valid Ghana phone number starting with 0 or +233 (e.g., 0241234567)",
      ),
    code: z
      .string()
      .min(1, "Reset code is required")
      .regex(/^\d{4}$/, "Please enter a valid 4-digit code"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(12, "Password must be at least 12 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ========== Helper for form validation ==========

export const getErrorMessage = (error) => {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return "An error occurred";
};
