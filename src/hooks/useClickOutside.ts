import { useEffect, RefObject } from 'react';

type TargetRef = RefObject<HTMLElement | null> | HTMLElement | null;

/**
 * Detects mousedown or touchstart outside one or multiple target elements.
 */
export function useClickOutside(
  target: TargetRef | TargetRef[],
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const targets = Array.isArray(target) ? target : [target];
      const clickedInside = targets.some((t) => {
        const el = t && 'current' in t ? t.current : t;
        return el && el.contains(event.target as Node);
      });

      if (!clickedInside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener, true);
    document.addEventListener('touchstart', listener, true);

    return () => {
      document.removeEventListener('mousedown', listener, true);
      document.removeEventListener('touchstart', listener, true);
    };
  }, [target, handler, enabled]);
}

export default useClickOutside;
