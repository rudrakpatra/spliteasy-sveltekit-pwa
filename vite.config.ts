import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			srcDir: './src',
			mode: 'development',
			scope: '/',
			base: '/',
			selfDestroying: process.env.SELF_DESTROYING_SW === 'true',
			manifest: {
				name: 'Split Easy - AI Bill Split',
				short_name: 'Split Easy',
				description: 'Split Bills using AI with Accuracy',
				theme_color: '#c96442',
				background_color: '#faf9f5',
				display: 'standalone',
				display_override: [
					'window-controls-overlay',  // Desktop: custom title bar with controls overlay
					'standalone',               // Looks like a native app
					'minimal-ui',              // Minimal browser UI
					'browser'                  // Standard browser tab
				],
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			},
			injectManifest: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
				globIgnores: ['**/node_modules/**/*'],
				navigateFallback: null
			},
			devOptions: {
				enabled: true,
				suppressWarnings: true,
				type: 'module',
				navigateFallback: '/'
			}
		}),
		devtoolsJson()
	]
});
