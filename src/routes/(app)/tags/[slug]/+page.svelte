<script lang="ts">
	import { ArrowLeft, Save, Loader2, Trash2, Tag, Info, Calendar, Clock, Globe } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();
	
	let isUpdating = $state(false);
	let isDeleting = $state(false);

	let name = $state(data.tag.name);
	let slug = $state(data.tag.slug);

	function generateSlug(str: string) {
		return str
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)+/g, '');
	}

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		name = target.value;
		// Only auto-generate slug if the user hasn't manually edited it significantly 
		// or if we're in a specific "link" mode, but here we just use it as a helper
	}
</script>

<div class="space-y-6 max-w-5xl mx-auto">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/tags" variant="outline" size="icon" class="rounded-full shadow-sm hover:shadow-md transition-all">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Edit Tag</h1>
				<p class="text-muted-foreground font-mono text-sm opacity-80 decoration-primary/30 underline-offset-4 underline">{data.tag.slug}</p>
			</div>
		</div>
	</div>

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
		class="space-y-8"
	>
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Info -->
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Tag size={18} class="text-primary" />
							Tag Information
						</CardTitle>
						<CardDescription>Primary identification and classification for filtering.</CardDescription>
					</CardHeader>
					<CardContent class="active-grid space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<label for="name" class="text-sm font-medium leading-none flex items-center gap-2">
									Tag Name *
								</label>
								<Input
									id="name"
									name="name"
									bind:value={name}
									required
									minlength={1}
									maxlength={100}
									oninput={handleNameInput}
									placeholder="e.g. DeFi"
									class="text-lg font-bold h-12"
								/>
							</div>

							<div class="space-y-2">
								<label for="slug" class="text-sm font-medium leading-none flex items-center gap-2">
									URL Slug *
								</label>
								<div class="flex items-center group">
									<div class="px-3 py-2 bg-muted border border-r-0 rounded-l-md text-muted-foreground text-xs font-mono h-10 flex items-center">/tags/</div>
									<Input
										id="slug"
										name="slug"
										bind:value={slug}
										required
										minlength={1}
										maxlength={100}
										class="rounded-l-none font-mono text-sm h-10 flex-1 group-focus-within:border-primary transition-colors"
									/>
								</div>
							</div>
						</div>

						<Separator />

						<div class="space-y-2">
							<label for="description" class="text-sm font-medium leading-none flex items-center gap-2 text-foreground/80">
								Description
							</label>
							<Textarea
								id="description"
								name="description"
								value={data.tag.description || ''}
								placeholder="What is this tag used for? (Optional)"
								class="min-h-[120px] resize-none focus:ring-1 focus:ring-primary/20 transition-all text-base"
							/>
						</div>
					</CardContent>
				</Card>

				<div class="pt-2">
					<Card>
						<CardHeader>
							<CardTitle class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
								<Info size={12} /> System History
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div class="flex items-center gap-3 group">
									<div class="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
										<Calendar size={16} />
									</div>
									<div>
										<p class="text-[10px] font-bold uppercase text-muted-foreground leading-none">Created</p>
										<p class="text-sm font-medium mt-1">{new Date(data.tag.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
									</div>
								</div>

								<div class="flex items-center gap-3 group">
									<div class="h-9 w-9 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
										<Clock size={16} />
									</div>
									<div>
										<p class="text-[10px] font-bold uppercase text-muted-foreground leading-none">Last Updated</p>
										<p class="text-sm font-medium mt-1">{data.tag.updatedAt ? new Date(data.tag.updatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : 'Never'}</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<!-- Sidebar Settings -->
			<div class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-primary">
							<Save size={18} />
							Actions
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<Button type="submit" disabled={isUpdating || isDeleting} class="w-full gap-2 h-12 font-bold shadow-sm hover:shadow-primary/20 transition-all">
							{#if isUpdating}
								<Loader2 class="h-5 w-5 animate-spin" />
								Saving...
							{:else}
								<Save size={18} />
								Update Tag
							{/if}
						</Button>

						{#if form?.message && !form.success}
							<div class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
								{form.message}
							</div>
						{/if}
						{#if form?.success}
							<div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
								{form.message}
							</div>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="text-sm font-bold text-destructive flex items-center gap-2">
							<Trash2 size={16} /> Danger Zone
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground mb-4 opacity-80">Deleting a tag may remove it from all associated posts and tokens. This action is irreversible.</p>
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
								variant="ghost"
								type="submit"
								disabled={isDeleting || isUpdating}
								class="w-full text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all font-medium"
							>
								{#if isDeleting}
									<Loader2 class="h-4 w-4 animate-spin mr-2" />
									Deleting...
								{:else}
									<Trash2 size={16} class="mr-2" />
									Delete Tag
								{/if}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>

