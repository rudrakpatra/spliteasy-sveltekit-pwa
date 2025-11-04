<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Receipt from '@tabler/icons-svelte/icons/receipt';
	import Settings from '@tabler/icons-svelte/icons/settings';
	import Users from '@tabler/icons-svelte/icons/users';

	let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col bg-background">
	<header class="border-b bg-card">
		<div class="container mx-auto px-4">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center space-x-4">
					<a href="/" class="text-xl font-bold">SplitEasy</a>
					<nav class="hidden md:flex">
						<a href="/dashboard">
							<Button variant="link" size="sm">Dashboard</Button>
						</a>
						<a href="/groups">
							<Button variant="link" size="sm">Groups</Button>
						</a>
						<a href="/profile">
							<Button variant="link" size="sm">Profile</Button>
						</a>
					</nav>
				</div>
				<a href="/auth/signout">
					<Button variant="link" size="sm">Sign out</Button>
				</a>
			</div>
		</div>
	</header>

	<main class="container mx-auto flex max-w-2xl flex-1 flex-col">
		{@render children()}
	</main>

	<footer id="app-footer" class="sticky right-0 bottom-0 left-0 border-t bg-card">
		<nav class="bottom-nav-bar grid h-16 grid-cols-3 md:hidden">
			<a href="/dashboard">
				<Receipt />
			</a>
			<a href="/groups">
				<Users />
			</a>
			<a href="/profile">
				<Settings />
			</a>
		</nav>
	</footer>
</div>

<style>
	.bottom-nav-bar {
		& > * {
			@apply grid place-content-center;
		}
	}
	#app-footer {
		anchor-name: --app-footer;
	}
</style>
