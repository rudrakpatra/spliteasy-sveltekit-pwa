// hooks/use-visual-viewport.svelte.ts
import { onMount } from 'svelte';

export interface VisualViewportData {
    width: number;
    height: number;
    offsetLeft: number;
    offsetTop: number;
    pageLeft: number;
    pageTop: number;
    scale: number;
}

export function useVisualViewport() {
    let viewport = $state<VisualViewportData>({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
        offsetLeft: 0,
        offsetTop: 0,
        pageLeft: 0,
        pageTop: 0,
        scale: 1
    });

    onMount(() => {
        // Check if Visual Viewport API is supported
        if (typeof window === 'undefined' || !window.visualViewport) {
            // Fallback to window dimensions
            const updateWindowDimensions = () => {
                viewport = {
                    ...viewport,
                    width: window.innerWidth,
                    height: window.innerHeight
                };
            };

            window.addEventListener('resize', updateWindowDimensions);
            return () => window.removeEventListener('resize', updateWindowDimensions);
        }

        const visualViewport = window.visualViewport;

        const updateViewport = () => {
            viewport = {
                width: visualViewport.width,
                height: visualViewport.height,
                offsetLeft: visualViewport.offsetLeft,
                offsetTop: visualViewport.offsetTop,
                pageLeft: visualViewport.pageLeft,
                pageTop: visualViewport.pageTop,
                scale: visualViewport.scale
            };
        };

        // Initial update
        updateViewport();

        // Listen for viewport changes
        visualViewport.addEventListener('resize', updateViewport);
        visualViewport.addEventListener('scroll', updateViewport);

        return () => {
            visualViewport.removeEventListener('resize', updateViewport);
            visualViewport.removeEventListener('scroll', updateViewport);
        };
    });

    return {
        get width() { return viewport.width; },
        get height() { return viewport.height; },
        get offsetLeft() { return viewport.offsetLeft; },
        get offsetTop() { return viewport.offsetTop; },
        get pageLeft() { return viewport.pageLeft; },
        get pageTop() { return viewport.pageTop; },
        get scale() { return viewport.scale; }
    };
}
