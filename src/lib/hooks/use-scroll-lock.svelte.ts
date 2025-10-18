// hooks/use-scroll-lock.svelte.ts
import { onMount } from 'svelte';

interface UseScrollLockOptions {
    autoLock?: boolean;
    lockTarget?: HTMLElement | string;
    widthReflow?: boolean;
}

interface OriginalStyle {
    overflow: string;
    paddingRight: string;
}

export function useScrollLock(options: UseScrollLockOptions = {}) {
    const { autoLock = true, lockTarget, widthReflow = true } = options;

    let isLocked = $state(false);
    let target: HTMLElement | null = null;
    let originalStyle: OriginalStyle | null = null;

    function lock() {
        if (!target) return;

        const { overflow, paddingRight } = target.style;

        // Save the original styles
        originalStyle = { overflow, paddingRight };

        // Prevent width reflow
        if (widthReflow) {
            // Use window inner width if body is the target as global scrollbar isn't part of the document
            const offsetWidth =
                target === document.body ? window.innerWidth : target.offsetWidth;

            // Get current computed padding right in pixels
            const currentPaddingRight =
                parseInt(window.getComputedStyle(target).paddingRight, 10) || 0;

            const scrollbarWidth = offsetWidth - target.scrollWidth;
            target.style.paddingRight = `${scrollbarWidth + currentPaddingRight}px`;
        }

        // Lock the scroll
        target.style.overflow = 'hidden';
        isLocked = true;
    }

    function unlock() {
        if (!target || !originalStyle) return;

        target.style.overflow = originalStyle.overflow;

        // Only reset padding right if we changed it
        if (widthReflow) {
            target.style.paddingRight = originalStyle.paddingRight;
        }

        isLocked = false;
    }

    onMount(() => {
        // Find the target element
        if (lockTarget) {
            target =
                typeof lockTarget === 'string'
                    ? document.querySelector(lockTarget)
                    : lockTarget;
        }

        if (!target) {
            target = document.body;
        }

        if (autoLock) {
            lock();
        }

        return () => {
            unlock();
        };
    });

    return {
        get isLocked() {
            return isLocked;
        },
        lock,
        unlock
    };
}

export type { UseScrollLockOptions };
