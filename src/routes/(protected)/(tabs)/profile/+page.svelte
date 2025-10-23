<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import X from '@lucide/svelte/icons/x';
	import type { PageData } from './$types';
	import Check from '@lucide/svelte/icons/check';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Input, InputGroup, InputGroupButton } from '$lib/components/ui/input-group';
	import InputGroupAddon from '$lib/components/ui/input-group/input-group-addon.svelte';
	import { useCurrencySuggestions } from '$lib/hooks/use-currency-suggestions';

	let { data }: { data: PageData } = $props();

	const currencySuggestions = useCurrencySuggestions();
</script>

<svelte:head>
	<title>Profile - SplitEasy</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<div class="rounded-lg border bg-card p-6 shadow-sm">
		<h1 class="mb-6 text-2xl font-bold">Profile</h1>

		<div class="space-y-6">
			<div
				class="flex flex-col items-center space-y-2 text-center md:flex-row md:space-x-4 md:text-left"
			>
				{#if data.user.image}
					<Avatar.Root class="block size-20 text-4xl">
						<Avatar.Image src={data.user.image} alt={data.user.name} />
						<Avatar.Fallback>{data.user.name.charAt(0)}</Avatar.Fallback>
					</Avatar.Root>
				{/if}
				<div>
					<h2 class="text-xl font-semibold">{data.user.name}</h2>
					<p class="text-muted-foreground">{data.user.email}</p>
				</div>
			</div>

			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="user-id">User ID</Label>
					<InputGroup>
						<Input id="user-id" value={data.user.id} disabled />
						<InputGroupAddon align="inline-end">
							<InputGroupButton>Copy</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</div>

				<div class="space-y-2">
					<Label for="email-status">Email Status</Label>
					<p id="email-status">
						{#if data.user.email_verified}
							<Badge variant="default"><Check /> Verified</Badge>
						{:else}
							<Badge variant="destructive"><X />Unverified</Badge>
						{/if}
					</p>
				</div>
			</div>

			<div class="border-t pt-4">
				<h3 class="mb-2 text-lg font-medium">Account Information</h3>
				<div class="space-y-1 text-sm text-muted-foreground">
					<p>• Signed in with Google OAuth</p>
					<p>• Account created through SplitEasy</p>
					<p>• Profile managed securely</p>
				</div>
			</div>

			<div class="border-t pt-4">
				<h3 class="mb-2 text-lg font-medium">Currency Suggestions</h3>
				<div class="space-y-1 text-sm text-muted-foreground">
					{#if $currencySuggestions.isLoading}
						<p>Loading...</p>
					{:else if $currencySuggestions.data}
						{#each $currencySuggestions.data as currency}
							<p>• {currency.currency}</p>
						{/each}
					{:else}
						<p>No currency suggestions available.</p>
					{/if}
				</div>
			</div>

			<div class="border-t pt-4">
				<h3 class="mb-2 text-lg font-medium">Virtual Keyboard</h3>
				<div class="space-y-1 text-sm text-muted-foreground">
					<p>
						{(navigator as any).virtualKeyboard?.overlaysContent
							? 'overlaysContent'
							: 'does not overlaysContent'}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
