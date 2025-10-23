<script lang="ts">
	import type { PageData } from './$types';
	import { createGroupSchema, transformedCreateGroupSchema } from '$lib/shared/schema/group';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import ImageField from './fields/image-field.svelte';
	import { setGroupAddFormContext } from './context.svelte';

	let { data }: { data: PageData } = $props();

	// Setup tRPC
	const api = trpc(page, data.queryClient);
	const utils = api.createUtils();

	// Setup mutation
	const createGroup = api.group.insert.createMutation({
		onSuccess: (group) => {
			utils.group.list.invalidate();
			goto(`/groups/${group.id}`);
		},
		onError: (error) => {
			toast.error('Failed to create group', { description: error.message });
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
				$createGroup.mutate(transformedCreateGroupSchema.parse(form.data));
			}
		}
	});

	const { form: formData, enhance } = form;

	// Image state
	let imageBlobUrl = $state<string | undefined>(undefined);
	let imageFile = $state<File | null>(null);
	let isUploadingImage = $state(false);

	function handleImageChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image must be less than 5MB');
			return;
		}

		if (imageBlobUrl) {
			URL.revokeObjectURL(imageBlobUrl);
		}

		imageFile = file;
		imageBlobUrl = URL.createObjectURL(file);
	}

	function removeImage() {
		if (imageBlobUrl) {
			URL.revokeObjectURL(imageBlobUrl);
		}
		imageBlobUrl = undefined;
		imageFile = null;
	}

	setGroupAddFormContext({
		form,
		get submitting() {
			return $createGroup.isPending;
		},
		image: {
			get blobUrl() {
				return imageBlobUrl;
			},
			get file() {
				return imageFile;
			},
			get isUploading() {
				return isUploadingImage;
			},
			onChange: handleImageChange,
			onRemove: removeImage
		}
	});
</script>

<svelte:head>
	<title>Create Group - SplitEasy</title>
</svelte:head>

<Card.Root class="mx-auto max-w-2xl border-0 shadow-none">
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
			<ImageField />
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
