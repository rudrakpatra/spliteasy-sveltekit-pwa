<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<div class="bg-background min-h-screen">
	<nav class="bg-card border-b">
		<div class="container mx-auto px-4">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center space-x-4">
					<a href="/" class="text-xl font-bold">SplitEasy</a>
					<nav class="hidden space-x-6 md:flex">
						<a href="/dashboard" class="hover:text-primary text-sm font-medium">Dashboard</a>
						<a href="/groups" class="hover:text-primary text-sm font-medium">Groups</a>
						<a href="/profile" class="hover:text-primary text-sm font-medium">Profile</a>
					</nav>
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-muted-foreground text-sm">Welcome, {data.user.name}</span>
					<a href="/auth/signout" class="text-muted-foreground hover:text-primary text-sm"
						>Sign out</a
					>
				</div>
			</div>
		</div>
	</nav>

	<main class="flex-1">
		{@render children()}
	</main>
</div>
