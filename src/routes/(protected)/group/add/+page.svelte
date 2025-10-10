<script lang="ts">
	import type { PageData } from './$types';
	import { createGroupSchema } from '$lib/schemas/group';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	// Setup tRPC
	const api = trpc(page, data.queryClient);
	const utils = api.createUtils();

	// Setup mutation
	const createGroup = api.group.create.createMutation({
		onSuccess: (group) => {
			utils.group.list.invalidate();
			goto(`/groups/${group.id}`);
		},
		onError: (error) => {
			console.error('Failed to create group:', error);
		}
	});

	// Setup Superforms with SPA mode (client-side only)
	const form = superForm(defaults(zod4(createGroupSchema)), {
		SPA: true,
		validators: zod4(createGroupSchema),
		resetForm: false,
		onUpdate({ form }) {
			// This runs when form is submitted and valid
			if (form.valid) {
				// Submit via tRPC mutation
				$createGroup.mutate(form.data);
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Create Group - SplitEasy</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<Card.Root>
		<Card.Header>
			<Card.Title>Create New Group</Card.Title>
			<Card.Description>Create a group to split expenses with friends or family</Card.Description>
		</Card.Header>

		<form use:enhance>
			<Card.Content class="space-y-6">
				<!-- Group Name Field -->
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Group Name</Form.Label>
							<Input
								{...props}
								placeholder="Trip to Bali"
								bind:value={$formData.name}
								disabled={$createGroup.isPending}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>Choose a memorable name for your group</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Group Image URL Field -->
				<Form.Field {form} name="img">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Group Image URL (Optional)</Form.Label>
							<Input
								{...props}
								type="url"
								placeholder="https://example.com/image.jpg"
								bind:value={$formData.img}
								disabled={$createGroup.isPending}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>Leave empty for auto-generated avatar</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<!-- tRPC Mutation Error -->
				{#if $createGroup.isError}
					<div class="bg-destructive/10 rounded-lg p-4">
						<p class="text-destructive text-sm">
							Error: {$createGroup.error.message}
						</p>
					</div>
				{/if}
			</Card.Content>

			<Card.Footer class="flex justify-between">
				<Button
					type="button"
					variant="outline"
					onclick={() => goto('/groups')}
					disabled={$createGroup.isPending}
				>
					Cancel
				</Button>

				<Button type="submit" disabled={$createGroup.isPending}>
					{#if $createGroup.isPending}
						Creating...
					{:else}
						Create Group
					{/if}
				</Button>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
