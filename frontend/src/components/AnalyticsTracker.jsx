import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const AnalyticsTracker = () => {
  const location = useLocation();
  const initialized = useRef(false);

  // Generate a random session ID that resets when the browser tab closes
  // to anonymize while tracking session uniqueness within an active period.
  if (!sessionStorage.getItem("visitor_session_id")) {
    sessionStorage.setItem("visitor_session_id", Math.random().toString(36).substring(2, 15));
  }
  const sessionId = sessionStorage.getItem("visitor_session_id");

  useEffect(() => {
    // We only want to track unique page navigations, blocking raw React StrictMode double mounts
    if (process.env.NODE_ENV === 'development' && !initialized.current) {
        initialized.current = true;
        return;
    }

    const trackPage = async () => {
      // Determine if they are hitting an agent's direct portal code
      // Format: /buy/:agentCode
      let sellerId = null;
      const pathSegments = location.pathname.split("/");
      if (pathSegments[1] === "buy" && pathSegments[2]) {
        // We capture the raw integer code. The backend could map this to sellerId,
        // but for now, we just pass the text string parameter backward to be saved.
        sellerId = pathSegments[2];
      }

      const deviceType = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        ? "Mobile" 
        : "Desktop";

      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
        await fetch(`${baseUrl}/track`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          // Send silently to telemetry
          body: JSON.stringify({
            sessionId,
            eventType: "PAGE_VIEW",
            path: location.pathname,
            sellerId,
            device: deviceType
          })
        });
      } catch (e) {
        // Completely silent fail
      }
    };

    trackPage();
  }, [location.pathname, sessionId]);

  return null; // Silent render
};
