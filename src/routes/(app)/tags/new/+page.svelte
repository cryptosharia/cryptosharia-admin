<script lang="ts">
	import { ArrowLeft, Save, Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { enhance } from '$app/forms';

	let { form } = $props();
	let isSubmitting = $state(false);

	let name = $state('');
	let slug = $state('');

	function generateSlug() {
		if (name && !slug) {
			slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
		}
	}
</script>

<div class="space-y-6 max-w-2xl">
	<div class="flex items-center gap-4">
		<Button href="/tags" variant="ghost" size="icon" class="h-8 w-8 rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Create Tag</h1>
			<p class="text-muted-foreground mt-1">Add a new tag for categorizing items.</p>
		</div>
	</div>

	{#if form?.message}
		<div class="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
			{form.message}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				isSubmitting = false;
				update();
			};
		}}
		class="glass-card rounded-xl p-6 space-y-6"
	>
		<div class="space-y-4">
			<div class="space-y-2">
				<label for="name" class="text-sm font-medium">Tag Name *</label>
				<Input
					id="name"
					name="name"
					bind:value={name}
					onblur={generateSlug}
					required
					minlength={1}
					maxlength={50}
					placeholder="e.g. Education, Exchange, DeFi"
					class="bg-background/50 focus:bg-background"
				/>
			</div>

			<div class="space-y-2">
				<label for="slug" class="text-sm font-medium">Slug *</label>
				<Input
					id="slug"
					name="slug"
					bind:value={slug}
					required
					minlength={1}
					maxlength={50}
					placeholder="e.g. education"
					class="bg-background/50 focus:bg-background font-mono text-sm"
				/>
				<p class="text-xs text-muted-foreground">URL friendly name. Custom slugs are allowed.</p>
			</div>

			<div class="space-y-2">
				<label for="description" class="text-sm font-medium">Description</label>
				<Textarea
					id="description"
					name="description"
					placeholder="Optional description for this tag..."
					class="bg-background/50 focus:bg-background min-h-[100px]"
				/>
			</div>
		</div>

		<div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10 dark:border-gray-800">
			<Button href="/tags" variant="ghost" type="button" disabled={isSubmitting}>Cancel</Button>
			<Button type="submit" disabled={isSubmitting} class="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
				{#if isSubmitting}
					<Loader2 class="h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Save class="h-4 w-4" />
					Create Tag
				{/if}
			</Button>
		</div>
	</form>
</div>
