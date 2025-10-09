<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Profile - SplitEasy</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<div class="bg-card rounded-lg border p-6 shadow-sm">
		<h1 class="mb-6 text-2xl font-bold">Profile</h1>

		<div class="space-y-6">
			<div class="flex items-center space-x-4">
				{#if data.user.image}
					<img src={data.user.image} alt={data.user.name} class="h-20 w-20 rounded-full" />
				{/if}
				<div>
					<h2 class="text-xl font-semibold">{data.user.name}</h2>
					<p class="text-muted-foreground">{data.user.email}</p>
				</div>
			</div>

			<div class="space-y-4">
				<div>
					<label for="user-id" class="text-muted-foreground text-sm font-medium">User ID</label>
					<p id="user-id" class="bg-muted mt-1 rounded p-2 font-mono text-sm">{data.user.id}</p>
				</div>

				<div>
					<label for="email-status" class="text-muted-foreground text-sm font-medium"
						>Email Status</label
					>
					<p id="email-status" class="mt-1 flex items-center gap-2">
						{#if data.user.email_verified}
							<span class="text-green-600">✓ Verified</span>
						{:else}
							<span class="text-yellow-600">○ Unverified</span>
						{/if}
					</p>
				</div>
			</div>

			<div class="border-t pt-4">
				<h3 class="mb-2 text-lg font-medium">Account Information</h3>
				<div class="text-muted-foreground space-y-1 text-sm">
					<p>• Signed in with Google OAuth</p>
					<p>• Account created through SplitEasy</p>
					<p>• Profile managed securely</p>
				</div>
			</div>
		</div>
	</div>
</div>
