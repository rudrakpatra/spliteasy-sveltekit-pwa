<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Welcome, {data.user.username}!</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="space-y-2">
				<p class="text-sm text-muted-foreground">User ID</p>
				<p class="font-mono text-sm">{data.user.id}</p>
			</div>
			<form method="post" action="?/logout" use:enhance>
				<Button type="submit" variant="destructive" class="w-full">Sign out</Button>
			</form>
		</CardContent>
	</Card>
</div>
