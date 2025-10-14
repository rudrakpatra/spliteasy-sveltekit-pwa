<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';

	let { userId }: { userId: string } = $props();

	const api = trpc(page);
	let user = api.user.getById.createQuery({ id: userId });
</script>

<div class="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
	<Avatar.Root>
		<Avatar.Image src={$user.data?.img} alt={$user.data?.name} />
		<Avatar.Fallback>
			{$user.data?.name.slice(0, 2).toUpperCase()}
		</Avatar.Fallback>
	</Avatar.Root>
	<div class="flex-1">
		<p class="font-medium">{$user.data?.name}</p>
		<p class="text-sm text-muted-foreground">{$user.data?.email}</p>
	</div>
</div>
