<script lang="ts">
	import type { PageData } from './$types';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Item from '$lib/components/ui/item';
	import * as Avatar from '$lib/components/ui/avatar';
	import ExclaimationCircle from '@tabler/icons-svelte/icons/exclamation-circle';
	import Receipt from '@tabler/icons-svelte/icons/receipt';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import EmblaScrollArea from '$lib/components/ui/embla-scroll-area/embla-scroll-area.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { Input } from '$lib/components/ui/input';
	import { useDebounce } from '$lib/hooks/use-debounce.svelte';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();

	// Setup tRPC client
	const api = trpc(page, data.queryClient);
	const utils = api.createUtils();

	// Derived stategroup
	let group = api.group.getById.createQuery({ id: data.groupId });
	// let members = api.group.getMembers.createQuery({ groupId: data.groupId });
	// let balances = api.group.getBalances.createQuery({ groupId: data.groupId });
	// let finalized = api.expense.getFinalized.createQuery({
	// 	groupId: data.groupId,
	// 	limit: 20,
	// 	offset: 0
	// });

	let email = $state('');
	let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	let debouncedEmail = useDebounce('', 500);
	let getByEmail = $derived(
		api.user.getByEmail.createQuery(
			{ email },
			{ enabled: emailRegex.test(email) && !debouncedEmail.loading }
		)
	);

	let addMemberMutation = api.group.addMember.createMutation({
		onSuccess: () => {
			utils.group.getMembers.invalidate({ groupId: data.groupId });
			toast.success('Added member');
		},
		onError: (error) => {
			toast.error('Failed to add member', { description: error.message });
		}
	});

	function addMember(id: string) {
		console.log({
			groupId: data.groupId,
			userId: id
		});
		$addMemberMutation.mutate({
			groupId: data.groupId,
			userId: id
		});
	}
</script>

<Item.Root>
	<Item.Content>
		<Input
			bind:value={email}
			placeholder="Enter name or email"
			oninput={() => {
				debouncedEmail.update(email);
			}}
		/>
	</Item.Content>
</Item.Root>
{#if $getByEmail.isPending}
	<Item.Root>
		<Item.Content>
			<Item.Title>Type an Email Id</Item.Title>
			<Item.Description>Start typing an email id to search for a user.</Item.Description>
		</Item.Content>
	</Item.Root>
{:else if $getByEmail.isLoading}
	<Item.Root>
		<Item.Content>
			<Item.Title>Loading...</Item.Title>
			<Item.Description>Searching for user...</Item.Description>
		</Item.Content>
	</Item.Root>
{:else if $getByEmail.isError}
	<Item.Root>
		<Item.Content>
			<Item.Title>Error</Item.Title>
			<Item.Description>{$getByEmail.error.message}</Item.Description>
		</Item.Content>
	</Item.Root>
{:else if $getByEmail.data}
	{@const user = $getByEmail.data}
	<Item.Root>
		<Item.Media>
			<Avatar.Root>
				<Avatar.Image src={user.img} alt={user.name} />
				<Avatar.Fallback>{user.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
			</Avatar.Root>
		</Item.Media>
		<Item.Content>
			<Item.Title>{user.name}</Item.Title>
			<Item.Description>
				{user.email}
			</Item.Description>
		</Item.Content>
		<Item.Actions>
			<Button
				size="sm"
				onclick={() => {
					addMember(user.id);
				}}
			>
				Add
			</Button>
		</Item.Actions>
	</Item.Root>
{:else}
	<Item.Root>
		<Item.Media>
			<Avatar.Root>
				<!-- <Avatar.Image src={email} alt={email} /> -->
				<Avatar.Fallback>{email.slice(0, 2).toUpperCase()}</Avatar.Fallback>
			</Avatar.Root>
		</Item.Media>
		<Item.Content>
			<Item.Title>New User</Item.Title>
			<Item.Description>{email}</Item.Description>
		</Item.Content>
		<Item.Actions>
			<Button size="sm">Invite</Button>
		</Item.Actions>
	</Item.Root>
{/if}
