<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import * as Item from '$lib/components/ui/item';

	const { group }: { group: { img: string; name: string; id: string; created_at: Date } } =
		$props();
	const api = trpc(page);
	let membersQuery = api.group.getMembers.createQuery({ groupId: group.id });
	let description = $derived.by(() => {
		const bits = [group.created_at.toLocaleDateString()];
		if ($membersQuery.isSuccess) {
			bits.push(
				`${$membersQuery.data.length} ${$membersQuery.data.length === 1 ? 'member' : 'members'}`
			);
		}
		return bits.reverse().join(' · ');
	});
</script>

<Item.Root>
	<Item.Media>
		<Avatar.Root>
			<Avatar.Image src={group.img} alt={group.name} />
			<Avatar.Fallback>{group.name.charAt(0)}</Avatar.Fallback>
		</Avatar.Root>
	</Item.Media>
	<Item.Content>
		<Item.Title>{group.name}</Item.Title>
		<Item.Description class="whitespace-nowrap">
			{description}
		</Item.Description>
	</Item.Content>
</Item.Root>
