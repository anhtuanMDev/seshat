import { useEffect, useRef } from "react";
import type { AnimationParams } from "animejs";
import { animate } from "animejs";

export function useAnimateIn(options: Partial<AnimationParams> = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 260,
      easing: "easeOutQuad",
      ...options,
    });
  }, [options]);

  return ref;
}
