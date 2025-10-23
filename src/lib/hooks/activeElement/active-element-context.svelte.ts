// activeElementContext.svelte.ts
import { getContext, hasContext, setContext } from 'svelte';
import { browser } from '$app/environment';
import { onDestroy, onMount, untrack } from 'svelte';

const ACTIVE_ELEMENT_KEY = Symbol('activeElement');

function createActiveElementContext() {
    let activeElement = $state<Element | null>(
        browser ? document.activeElement : null
    );

    function updateActiveElement() {
        untrack(() => {
            activeElement = document.activeElement;
        });
    }

    onMount(() => {
        if (browser) {
            document.addEventListener('focusin', updateActiveElement);
            document.addEventListener('focusout', updateActiveElement);
        }
    });

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

export function useActiveElement() {
    if (hasContext(ACTIVE_ELEMENT_KEY)) {
        return getContext<ReturnType<typeof createActiveElementContext>>(ACTIVE_ELEMENT_KEY);
    }

    const context = createActiveElementContext();
    setContext(ACTIVE_ELEMENT_KEY, context);
    return context;
}
