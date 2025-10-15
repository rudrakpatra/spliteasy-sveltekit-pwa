// useActiveElement.svelte.ts
import { browser } from '$app/environment';
import { onDestroy, onMount } from 'svelte';

export function useActiveElement() {
    let activeElement = $state<Element | null>(
        browser ? document.activeElement : null
    );

    function updateActiveElement() {
        activeElement = document.activeElement;
    }

    // Track focus and blur events on the entire document
    onMount(() => {
        if (browser) {
            document.addEventListener('focusin', updateActiveElement);
            document.addEventListener('focusout', updateActiveElement);
        }
    });

    // Cleanup listeners when component is destroyed
    onDestroy(() => {
        if (browser) {
            document.removeEventListener('focusin', updateActiveElement);
            document.removeEventListener('focusout', updateActiveElement);
        }
    });

    return {
        get current() {
            return activeElement;
        }
    };
}
