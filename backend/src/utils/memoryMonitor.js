import { logger } from "./logger.js";
import os from "os";

/**
 * Memory monitoring utilities
 * Helps track and manage memory usage
 */

/**
 * Get current memory usage statistics
 * @returns {Object} Memory usage information
 */
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    process: {
      rss: usage.rss, // Resident Set Size - total memory allocated
      heapTotal: usage.heapTotal, // Total heap allocated
      heapUsed: usage.heapUsed, // Heap actually used
      external: usage.external, // C++ objects bound to JS objects
      arrayBuffers: usage.arrayBuffers, // ArrayBuffers and SharedArrayBuffers
    },
    system: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usagePercent: ((usedMemory / totalMemory) * 100).toFixed(2),
    },
    formatted: {
      rss: formatBytes(usage.rss),
      heapTotal: formatBytes(usage.heapTotal),
      heapUsed: formatBytes(usage.heapUsed),
      external: formatBytes(usage.external),
      systemTotal: formatBytes(totalMemory),
      systemFree: formatBytes(freeMemory),
      systemUsed: formatBytes(usedMemory),
      systemUsagePercent: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`,
    },
  };
};

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Log memory usage
 * @param {string} context - Context for the log (e.g., "after request")
 */
export const logMemoryUsage = (context = "") => {
  const memory = getMemoryUsage();
  logger.info(`Memory usage ${context}`, {
    rss: memory.formatted.rss,
    heapUsed: memory.formatted.heapUsed,
    heapTotal: memory.formatted.heapTotal,
    systemUsage: memory.formatted.systemUsagePercent,
  });
};

/**
 * Check if memory usage is high
 * @param {number} thresholdPercent - Threshold percentage (default: 80)
 * @returns {Object} Memory status
 */
export const checkMemoryUsage = (thresholdPercent = 80) => {
  const memory = getMemoryUsage();
  const processUsagePercent =
    (memory.process.heapUsed / memory.process.heapTotal) * 100;
  const systemUsagePercent = parseFloat(memory.system.usagePercent);

  const isHigh = {
    process: processUsagePercent > thresholdPercent,
    system: systemUsagePercent > thresholdPercent,
  };

  if (isHigh.process || isHigh.system) {
    logger.warn("High memory usage detected", {
      processUsage: `${processUsagePercent.toFixed(2)}%`,
      systemUsage: `${systemUsagePercent}%`,
      threshold: `${thresholdPercent}%`,
    });
  }

  return {
    ...memory,
    isHigh,
    warnings: {
      process: isHigh.process
        ? `Process heap usage is ${processUsagePercent.toFixed(2)}%`
        : null,
      system: isHigh.system
        ? `System memory usage is ${systemUsagePercent}%`
        : null,
    },
  };
};

/**
 * Force garbage collection if available
 * Note: Requires Node.js to be started with --expose-gc flag
 */
export const forceGarbageCollection = () => {
  if (global.gc) {
    global.gc();
    logger.info("Garbage collection forced");
    return true;
  } else {
    logger.warn(
      "Garbage collection not available. Start Node.js with --expose-gc flag",
    );
    return false;
  }
};
