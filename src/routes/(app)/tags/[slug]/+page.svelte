<script lang="ts">
	import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();
	
	let isUpdating = $state(false);
	let isDeleting = $state(false);

	let name = $state(data.tag.name);
	let slug = $state(data.tag.slug);

</script>

<div class="space-y-6 max-w-2xl">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/tags" variant="ghost" size="icon" class="h-8 w-8 rounded-full">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Edit Tag</h1>
				<p class="text-muted-foreground mt-1 text-sm">{data.tag.slug}</p>
			</div>
		</div>

		<form
			method="POST"
			action="?/delete"
			use:enhance={() => {
				if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) return;
				isDeleting = true;
				return async ({ result }) => {
					isDeleting = false;
				};
			}}
		>
			<Button
				variant="destructive"
				type="submit"
				disabled={isDeleting || isUpdating}
				class="gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-transparent"
			>
				{#if isDeleting}
					<Loader2 class="h-4 w-4 animate-spin" />
					Deleting...
				{:else}
					<Trash2 size={16} />
					Delete Tag
				{/if}
			</Button>
		</form>
	</div>

	{#if form?.message && !form.success}
		<div class="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
			{form.message}
		</div>
	{/if}
	{#if form?.success}
		<div class="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-sm">
			{form.message}
		</div>
	{/if}

	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			isUpdating = true;
			return async ({ result, update }) => {
				isUpdating = false;
				if (result.type === 'success' && result.data?.success) {
					if (slug !== data.tag.slug) {
						goto(`/tags/${slug}`);
					}
				}
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
					required
					minlength={1}
					maxlength={50}
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
					class="bg-background/50 focus:bg-background font-mono text-sm"
				/>
			</div>

			<div class="space-y-2">
				<label for="description" class="text-sm font-medium">Description</label>
				<Textarea
					id="description"
					name="description"
					value={data.tag.description || ''}
					class="bg-background/50 focus:bg-background min-h-[100px]"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4 pt-2">
				<div>
					<p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created At</p>
					<p class="text-sm font-medium">{new Date(data.tag.createdAt).toLocaleString()}</p>
				</div>
				<div>
					<p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Updated At</p>
					<p class="text-sm font-medium">{data.tag.updatedAt ? new Date(data.tag.updatedAt).toLocaleString() : '-'}</p>
				</div>
			</div>
		</div>

		<div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10 dark:border-gray-800">
			<Button href="/tags" variant="ghost" type="button" disabled={isUpdating || isDeleting}>Cancel</Button>
			<Button type="submit" disabled={isUpdating || isDeleting} class="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
				{#if isUpdating}
					<Loader2 class="h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Save class="h-4 w-4" />
					Save Changes
				{/if}
			</Button>
		</div>
	</form>
</div>
