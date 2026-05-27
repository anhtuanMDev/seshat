import { useEffect, useRef } from 'react';
import { animate } from 'animejs/animation';

export function useAnimateIn(options: any = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 260,
      easing: 'easeOutQuad',
      ...options,
    });
  }, []);

  return ref;
}