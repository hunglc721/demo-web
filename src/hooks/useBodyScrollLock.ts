import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';

/**
 * Prevents body scrolling when overlays/modals are active, preserving scrollbar state.
 * Supports stacked dialogs/drawers via a global reference counter.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
