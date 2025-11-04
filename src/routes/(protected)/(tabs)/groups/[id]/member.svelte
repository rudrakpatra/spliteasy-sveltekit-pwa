<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import * as Item from '$lib/components/ui/item';

	let { userId }: { userId: string } = $props();

	const api = trpc(page);
	let user = api.user.getById.createQuery({ id: userId });
</script>

<Item.Root>
	<Item.Media>
		<Avatar.Root>
			<Avatar.Image src={$user.data?.img} alt={$user.data?.name} />
			<Avatar.Fallback>{$user.data?.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
		</Avatar.Root>
	</Item.Media>
	<Item.Content>
		<Item.Title>{$user.data?.name}</Item.Title>
		<Item.Description>
			{$user.data?.email}
		</Item.Description>
	</Item.Content>
</Item.Root>
