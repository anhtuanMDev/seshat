import { useEffect, useRef } from "react";
import { animate } from "animejs";

export function useAnimateIn() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 260,
      easing: "easeOutQuad",
    });
    // Intentionally empty deps to run only once on mount
  }, []);

  return ref;
}
