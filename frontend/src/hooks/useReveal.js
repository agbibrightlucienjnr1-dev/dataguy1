import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element has scrolled into view, once, so mounted
 * content can transition in instead of popping in fully rendered.
 */
export function useReveal({ threshold = 0.15, rootMargin = "0px 0px -80px 0px" } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (isVisible) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);

    // Safety net: on a short page where the element's position never
    // clears the shrunk rootMargin (e.g. it's the last thing on a page
    // with no extra room to scroll past it), the observer can go the
    // whole page lifetime without ever reporting an intersection, leaving
    // the content permanently at opacity:0. Force a reveal after a short
    // delay so nothing is ever stuck invisible.
    const fallback = setTimeout(() => setIsVisible(true), 1200);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold, rootMargin, isVisible]);

  return [ref, isVisible];
}
