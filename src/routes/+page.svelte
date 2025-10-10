<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<a href="/dashboard" data-sveltekit-reload>
	<Button variant="link">Dashboard</Button>
</a>

<footer>
	<div class="container mx-auto px-4">
		<p>&copy; {new Date().getFullYear()} SplitEasy. All rights reserved.</p>
	</div>
</footer>
