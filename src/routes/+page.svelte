<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex min-h-dvh flex-col">
	<header></header>
	<main class="grid flex-1 place-content-center space-y-4 text-center">
		<h1 class="text-6xl font-bold">SplitEasy</h1>
		<p>Manage your expenses with ease.</p>
		<a href="/dashboard" data-sveltekit-reload>
			<Button variant="default">Get Started</Button>
		</a>
		<a href="/scan" data-sveltekit-reload>
			<Button variant="default">Scan Bill</Button>
		</a>
	</main>
	<footer class="p-2 text-center">
		<p>&copy; {new Date().getFullYear()} SplitEasy. All rights reserved.</p>
	</footer>
</div>
