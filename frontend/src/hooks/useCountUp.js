import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from 0 to `target` once `start` is true.
 * Returns the current rounded value for the duration of the tween.
 */
export function useCountUp(target, { start = true, duration = 1200 } = {}) {
  const [value, setValue] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    const numericTarget = Number(target);
    if (!start || Number.isNaN(numericTarget)) {
      return undefined;
    }

    const startTime = performance.now();
    const from = 0;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (numericTarget - from) * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, start, duration]);

  return value;
}
