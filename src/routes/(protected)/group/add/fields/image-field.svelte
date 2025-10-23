<script lang="ts">
	import { getGroupAddFormContext } from '../context.svelte';
	import * as Form from '$lib/components/ui/form';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import LibraryPhoto from '@tabler/icons-svelte/icons/library-photo';
	import Upload from '@tabler/icons-svelte/icons/upload';
	import Scan from '@tabler/icons-svelte/icons/scan';
	import Trash from '@tabler/icons-svelte/icons/trash';

	const ctx = getGroupAddFormContext();
	const { form, image } = ctx;
</script>

<Form.Field {form} name="img">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label>Group Image</Form.Label>

			<Avatar.Root
				class="h-auto min-h-32 w-full overflow-hidden rounded-lg border border-border shadow-xs"
			>
				<Avatar.Image class="aspect-auto w-full rounded-lg" src={image.blobUrl} alt="Image" />
				<Avatar.Fallback
					class="flex aspect-auto min-h-32 items-center justify-center rounded-lg bg-transparent shadow-xs"
				>
					<LibraryPhoto class="block stroke-muted-foreground" />
				</Avatar.Fallback>
			</Avatar.Root>

			<div class="flex gap-2">
				<Button class="relative flex-1" variant="outline" type="button">
					<label for="image-upload" class="absolute inset-0 cursor-pointer"></label>
					<Input
						id="image-upload"
						class="hidden"
						accept="image/*"
						type="file"
						onchange={image.onChange}
						disabled={image.isUploading}
					/>
					<Upload /> Upload
				</Button>

				<Button class="relative flex-1" variant="outline" type="button">
					<label for="image-scan" class="absolute inset-0 cursor-pointer"></label>
					<Input
						id="image-scan"
						class="hidden"
						accept="image/*"
						capture="environment"
						type="file"
						onchange={image.onChange}
						disabled={image.isUploading}
					/>
					<Scan /> Scan
				</Button>
				{#if image.blobUrl}
					<Button variant="outline" type="button" onclick={image.onRemove}>
						<Trash />
					</Button>
				{/if}
			</div>
		{/snippet}
	</Form.Control>
	<Form.Description>Upload a receipt image for this expense</Form.Description>
	<Form.FieldErrors />
</Form.Field>
