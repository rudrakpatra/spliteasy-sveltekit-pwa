<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { loginSchema } from '$lib/schemas/auth';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const form = superForm(data.form, {
		validators: zod4Client(loginSchema),
		validationMethod: 'auto'
	});

	const { form: formData, enhance, message } = form;
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle class="text-2xl">Login / Register</CardTitle>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/login" use:enhance class="space-y-4">
				<Form.Field {form} name="username">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Username</Form.Label>
							<Input {...props} bind:value={$formData.username} placeholder="Enter your username" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Password</Form.Label>
							<Input
								{...props}
								bind:value={$formData.password}
								type="password"
								placeholder="Enter your password"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				{#if $message}
					<p class="text-destructive text-sm">{$message}</p>
				{/if}

				<div class="flex gap-3">
					<Button type="submit" class="flex-1">Login</Button>
					<Button type="submit" formaction="?/register" variant="outline" class="flex-1">
						Register
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
