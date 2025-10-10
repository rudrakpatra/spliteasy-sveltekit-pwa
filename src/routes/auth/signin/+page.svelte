<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import GoogleIcon from '$lib/components/icons/google.svelte';
	import { page } from '$app/state'; // Use $app/stores, not $app/state
	import type { PageData } from './$types';
	import * as Avatar from '$lib/components/ui/avatar';

	let { data }: { data: PageData } = $props();

	let user = data.user;
	let redirectUrl = page.url.searchParams.get('redirect_to') || '/';
	let error = page.url.searchParams.get('error');
</script>

<div class="bg-background flex min-h-screen flex-col">
	<!-- Main Content -->
	<main class="container mx-auto grid flex-1 place-content-center space-y-4 p-4 text-center">
		<div class="min-w-xs mx-auto max-w-xl space-y-8">
			<!-- Sign In Card -->
			<Card>
				<CardHeader class="text-center">
					<CardTitle>Sign In to SplitEasy</CardTitle>
					<CardDescription>Choose your preferred sign-in method</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if error === 'auth_failed'}
						<div class="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
							Authentication failed. Please try again.
						</div>
					{:else if error === 'invalid_state'}
						<div class="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
							Invalid request. Please try again.
						</div>
					{/if}

					{#if user}
						<div>
							<a href={redirectUrl}>
								<Button class="w-full" variant="outline">
									<Avatar.Avatar class="h-6 w-6">
										<Avatar.AvatarImage src={user.image || ''} />
										<Avatar.AvatarFallback class="bg-primary text-xs">
											{#if user.name}
												{user.name
													.split(' ')
													.map((n) => n[0])
													.join('')}
											{:else if user.email}
												{user.email[0].toUpperCase()}
											{:else}
												U
											{/if}
										</Avatar.AvatarFallback>
									</Avatar.Avatar>
									Continue as {user.name || user.email}
								</Button>
							</a>
						</div>
					{/if}

					<a href="/auth/signin/callback?redirect_to={encodeURIComponent(redirectUrl)}">
						<Button type="button" class="w-full" variant="outline">
							<GoogleIcon class="h-4 w-4" />
							Continue with Google
						</Button>
					</a>
				</CardContent>
			</Card>
		</div>
	</main>
</div>
