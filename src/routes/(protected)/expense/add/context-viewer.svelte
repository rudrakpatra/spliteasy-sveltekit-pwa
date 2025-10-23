<script lang="ts">
	import { page } from '$app/state';
	import { uuidSchema } from '$lib/shared/schema/uuid';
	import { trpc } from '$lib/trpc/client';
	import { getExpenseFormContext } from './context.svelte';

	const ctx = getExpenseFormContext();
	const { form } = ctx;
	const { form: formData } = form;
	const api = trpc(page);

	const groupsQuery = $derived(
		api.group.list.createQuery({ limit: 20, offset: 0 }, { refetchInterval: Infinity })
	);

	const membersQuery = $derived(
		api.group.getMembers.createQuery(
			{ groupId: $formData.groupId },
			{
				refetchInterval: Infinity,
				enabled: uuidSchema.safeParse($formData.groupId).success
			}
		)
	);
</script>

<!-- Debug JSON -->
<pre>
	ctx:
	{JSON.stringify(ctx, null, 2)}
	____
	membersQueryData:
	{JSON.stringify($membersQuery.data, null, 2)}
	____
	groupsQueryData:
	{JSON.stringify($groupsQuery.data, null, 2)}
</pre>

<style>
	pre {
		font-size: 10px;
		white-space: pre-wrap;
		width: 100%;
		overflow-x: auto;
	}
</style>
