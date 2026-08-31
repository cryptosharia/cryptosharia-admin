<script lang="ts">
	import { ArrowLeft, Save, Loader2, Trash2, Tag, Info, Calendar, Clock } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	let isUpdating = $state(false);
	let isDeleting = $state(false);

	let name = $state('');
	let slug = $state('');
	let showInNavigation = $state(false);
	let contentSection = $state('');

	$effect(() => {
		name = data.tag.name;
		slug = data.tag.slug;
		showInNavigation = Boolean((data.tag as { showInNavigation?: boolean }).showInNavigation);
		contentSection = (data.tag as { contentSection?: string | null }).contentSection ?? '';
	});

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		name = target.value;
		// Only auto-generate slug if the user hasn't manually edited it significantly
		// or if we're in a specific "link" mode, but here we just use it as a helper
	}
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button
				href="/tags"
				variant="outline"
				size="icon"
				class="rounded-full shadow-sm transition-all hover:shadow-md"
			>
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Edit Tag</h1>
				<p
					class="font-mono text-sm text-muted-foreground underline decoration-primary/30 underline-offset-4 opacity-80"
				>
					{data.tag.slug}
				</p>
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
		<input type="hidden" name="id" value={data.tag.id} />
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Main Info -->
			<div class="space-y-6 lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Tag size={18} class="text-primary" />
							Tag Information
						</CardTitle>
						<CardDescription
							>Primary identification and classification for filtering.</CardDescription
						>
					</CardHeader>
					<CardContent class="active-grid space-y-6">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<label for="name" class="flex items-center gap-2 text-sm leading-none font-medium">
									Tag Name *
								</label>
								<Input
									id="name"
									name="name"
									bind:value={name}
									required
									minlength={1}
									maxlength={50}
									oninput={handleNameInput}
									placeholder="e.g. DeFi"
									class="h-12 text-lg font-bold"
								/>
							</div>

							<div class="space-y-2">
								<label for="slug" class="flex items-center gap-2 text-sm leading-none font-medium">
									URL Slug *
								</label>
								<div class="group flex items-center">
									<div
										class="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 py-2 font-mono text-xs text-muted-foreground"
									>
										/tags/
									</div>
									<Input
										id="slug"
										name="slug"
										bind:value={slug}
										required
										minlength={1}
										maxlength={50}
										class="h-10 flex-1 rounded-l-none font-mono text-sm transition-colors group-focus-within:border-primary"
									/>
								</div>
							</div>
						</div>

						<Separator />

						<div class="space-y-2">
							<label
								for="description"
								class="flex items-center gap-2 text-sm leading-none font-medium text-foreground/80"
							>
								Description
							</label>
							<Textarea
								id="description"
								name="description"
								value={data.tag.description || ''}
								placeholder="What is this tag used for? (Optional)"
								class="min-h-[120px] resize-none text-base transition-all focus:ring-1 focus:ring-primary/20"
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader
						><CardTitle>Public Content Category</CardTitle><CardDescription
							>Control whether this tag appears in the public category menu.</CardDescription
						></CardHeader
					>
					<CardContent class="space-y-4">
						<label class="flex items-center gap-3 text-sm font-medium"
							><input
								type="checkbox"
								name="showInNavigation"
								bind:checked={showInNavigation}
								class="h-4 w-4"
							/> Tampilkan di navigasi publik</label
						>
						<div>
							<label class="space-y-2 text-sm font-medium"
								>Section<select
									name="contentSection"
									bind:value={contentSection}
									disabled={!showInNavigation}
									class="h-10 w-full rounded-md border bg-background px-3"
									><option value="">Pilih section</option><option value="news">Berita</option
									><option value="education">Edukasi</option></select
								></label
							>
						</div>
					</CardContent>
				</Card>

				<div class="pt-2">
					<Card>
						<CardHeader>
							<CardTitle
								class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
							>
								<Info size={12} /> System History
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="group flex items-center gap-3">
									<div
										class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110"
									>
										<Calendar size={16} />
									</div>
									<div>
										<p class="text-[10px] leading-none font-bold text-muted-foreground uppercase">
											Created
										</p>
										<p class="mt-1 text-sm font-medium">
											{new Date(data.tag.createdAt).toLocaleString('id-ID', {
												dateStyle: 'long',
												timeStyle: 'short'
											})}
										</p>
									</div>
								</div>

								<div class="group flex items-center gap-3">
									<div
										class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110"
									>
										<Clock size={16} />
									</div>
									<div>
										<p class="text-[10px] leading-none font-bold text-muted-foreground uppercase">
											Last Updated
										</p>
										<p class="mt-1 text-sm font-medium">
											{data.tag.updatedAt
												? new Date(data.tag.updatedAt).toLocaleString('id-ID', {
														dateStyle: 'long',
														timeStyle: 'short'
													})
												: 'Never'}
										</p>
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
						<Button
							type="submit"
							disabled={isUpdating || isDeleting}
							class="h-12 w-full gap-2 font-bold shadow-sm transition-all hover:shadow-primary/20"
						>
							{#if isUpdating}
								<Loader2 class="h-5 w-5 animate-spin" />
								Saving...
							{:else}
								<Save size={18} />
								Update Tag
							{/if}
						</Button>

						{#if form?.message && !form.success}
							<div
								class="animate-in fade-in slide-in-from-top-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
							>
								{form.message}
							</div>
						{/if}
						{#if form?.success}
							<div
								class="animate-in fade-in slide-in-from-top-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
							>
								{form.message}
							</div>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-sm font-bold text-destructive">
							<Trash2 size={16} /> Danger Zone
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="mb-4 text-xs text-muted-foreground opacity-80">
							Deleting a tag may remove it from all associated posts and tokens. This action is
							irreversible.
						</p>
						<form
							method="POST"
							action="?/delete"
							use:enhance={() => {
								if (
									!confirm(
										'Are you sure you want to delete this tag? This action cannot be undone.'
									)
								)
									return;
								isDeleting = true;
								return async ({ result }) => {
									isDeleting = false;
								};
							}}
						>
							<input type="hidden" name="id" value={data.tag.id} />
							<Button
								variant="ghost"
								type="submit"
								disabled={isDeleting || isUpdating}
								class="w-full border border-transparent font-medium text-destructive transition-all hover:border-destructive/20 hover:bg-destructive/10"
							>
								{#if isDeleting}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
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
