import apiClient from "../api/client";

const VAPID_PUBLIC_KEY = "BGKqzO89_s9F8qn9JVjChDq-OqZK4jSY-O8bnGqILGb3Pb8LaM1eSQhpWH0Ha5TTPG-9kwB65JE-KJazgEDlr4o";

/**
 * Convert base64 VAPID public key to Uint8Array required by subscribe()
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported by the current browser
 */
export const isPushSupported = () => {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

/**
 * Get current browser notification permission state
 */
export const getNotificationPermissionState = () => {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
};

/**
 * Register the background service worker sw.js
 */
export const registerServiceWorker = async () => {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/"
    });
    console.log("Service Worker registered successfully with scope:", registration.scope);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
};

/**
 * Prompt user for permissions, generate push subscription, and send to backend
 */
export const subscribeUserToPush = async (phone = null, role = "customer") => {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }

  // 1. Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied by user");
  }

  // 2. Register Service Worker first to ensure registration is active
  await registerServiceWorker();

  // 3. Wait for service worker to be ready
  const registration = await navigator.serviceWorker.ready;

  // 4. Subscribe with browser's PushManager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // 5. Send subscription info to backend API
  const response = await apiClient.post("/notifications/subscribe", {
    subscription,
    phone,
    role,
  });

  return response;
};
