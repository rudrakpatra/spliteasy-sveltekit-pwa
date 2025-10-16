<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	let {
		userId,
		children
	}: {
		userId: string;
		children: Snippet<[typeof $userQuery]>;
	} = $props();

	const api = trpc(page);
	const userQuery = api.user.getById.createQuery({ id: userId });
</script>

{@render children($userQuery)}
