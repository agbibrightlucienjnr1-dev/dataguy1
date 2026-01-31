/**
 * Environment variable validation
 * Ensures all required environment variables are present before application starts
 */

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "PAYSTACK_SECRET_KEY",
  "HUBNET_API_KEY",
  "HUBNET_BASE_URL",
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required environment variable is missing
 */
export const validateEnv = () => {
  const missing = requiredEnvVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  // Validate NODE_ENV
  const validEnvs = ["development", "production", "test"];
  if (
    process.env.NODE_ENV &&
    !validEnvs.includes(process.env.NODE_ENV)
  ) {
    throw new Error(
      `NODE_ENV must be one of: ${validEnvs.join(", ")}`,
    );
  }

  console.log("✅ Environment variables validated");
};
