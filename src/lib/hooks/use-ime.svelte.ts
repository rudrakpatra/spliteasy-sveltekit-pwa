import { onMount } from 'svelte';

export function useIME() {
    let isKeyboardVisible = $state(false);
    let keyboardHeight = $state(0);
    let safeAreaTop = $state(0);
    let safeAreaBottom = $state(0);

    onMount(() => {
        if (!('virtualKeyboard' in navigator)) {
            // Set default safe area if API not supported
            safeAreaBottom = window.innerHeight;
            return;
        }

        // Enable overlay mode so keyboard doesn't resize viewport
        (navigator as any).virtualKeyboard.overlaysContent = true;

        const updateSafeArea = () => {
            const rect = (navigator as any).virtualKeyboard.boundingRect;
            keyboardHeight = rect.height;
            isKeyboardVisible = rect.height > 0;

            // Safe area is the viewport minus keyboard
            safeAreaTop = 0;
            safeAreaBottom = window.innerHeight - rect.height;
        };

        // Initial update
        updateSafeArea();

        // Listen for keyboard changes
        (navigator as any).virtualKeyboard.addEventListener('geometrychange', updateSafeArea);

        // Cleanup
        return () => {
            (navigator as any).virtualKeyboard.removeEventListener('geometrychange', updateSafeArea);
        };
    });

    // Helper function to check if an element is in safe area
    const isElementInSafeArea = (element: HTMLElement | null): boolean => {
        if (!element) return true;

        const rect = element.getBoundingClientRect();
        return rect.bottom <= safeAreaBottom;
    };

    // Helper to get transform to move element into safe area
    const getTransformToSafeArea = (element: HTMLElement | null): string => {
        if (!element || !isKeyboardVisible) return '';

        const rect = element.getBoundingClientRect();
        if (rect.bottom > safeAreaBottom) {
            const overlap = rect.bottom - safeAreaBottom;
            return `translateY(-${overlap}px)`;
        }
        return '';
    };

    return {
        get isKeyboardVisible() { return isKeyboardVisible; },
        get keyboardHeight() { return keyboardHeight; },
        get safeAreaTop() { return safeAreaTop; },
        get safeAreaBottom() { return safeAreaBottom; },
        isElementInSafeArea,
        getTransformToSafeArea
    };
}
