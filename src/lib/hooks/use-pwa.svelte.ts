// usePWA.svelte.ts
import { onMount } from 'svelte';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
    let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
    let canInstall = $state(false);
    let isInstalled = $state(false);
    let isStandalone = $state(false);

    onMount(() => {
        // Check if app is already running as PWA
        isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            deferredPrompt = e as BeforeInstallPromptEvent;
            canInstall = true;
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            deferredPrompt = null;
            canInstall = false;
            isInstalled = true;
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    });

    const promptInstall = async () => {
        if (!deferredPrompt) {
            console.warn('PWA install prompt not available');
            return { outcome: 'unavailable' };
        }

        try {
            // Show the install prompt
            await deferredPrompt.prompt();

            // Wait for the user's response
            const choiceResult = await deferredPrompt.userChoice;

            // Reset the deferred prompt
            deferredPrompt = null;
            canInstall = false;

            if (choiceResult.outcome === 'accepted') {
                isInstalled = true;
            }

            return choiceResult;
        } catch (error) {
            console.error('Error showing install prompt:', error);
            return { outcome: 'error', error };
        }
    };

    return {
        get canInstall() { return canInstall; },
        get isInstalled() { return isInstalled; },
        get isStandalone() { return isStandalone; },
        promptInstall
    };
}
