<script lang="ts">
	import { ArrowLeft, Save, Loader2, Tag, Info, Globe } from 'lucide-svelte';
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

	let { form } = $props();
	let isSubmitting = $state(false);

	let name = $state('');
	let slug = $state('');
	let showInNavigation = $state(false);
	let contentSection = $state('');

	function generateSlug(str: string) {
		return str
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)+/g, '');
	}

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		name = target.value;
		if (!slug || slug === generateSlug(name.slice(0, -1))) {
			slug = generateSlug(name);
		}
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
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Create Tag</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new tag for categorizing items across the platform.
				</p>
			</div>
		</div>
	</div>

	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				isSubmitting = false;
				update();
			};
		}}
		class="space-y-8"
	>
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
									placeholder="e.g. Education, DeFi, Halal"
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
										placeholder="auto-generated-slug"
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
								placeholder="What is this tag used for? (Optional)"
								class="min-h-[120px] resize-none text-base transition-all focus:ring-1 focus:ring-primary/20"
							/>
							<div
								class="mt-2 flex items-start gap-2 rounded border border-border/50 bg-muted/50 p-2 text-[11px] text-muted-foreground"
							>
								<Info size={14} class="mt-0.5 text-primary" />
								<p>Descriptions help other admin managers understand the purpose of this tag.</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Public Content Category</CardTitle>
						<CardDescription
							>Show this tag as a category in the public Berita or Edukasi menu.</CardDescription
						>
					</CardHeader>
					<CardContent class="space-y-4">
						<label class="flex items-center gap-3 text-sm font-medium">
							<input
								type="checkbox"
								name="showInNavigation"
								bind:checked={showInNavigation}
								class="h-4 w-4"
							/>
							Tampilkan di navigasi publik
						</label>
						<div>
							<label class="space-y-2 text-sm font-medium"
								>Section
								<select
									name="contentSection"
									bind:value={contentSection}
									disabled={!showInNavigation}
									class="h-10 w-full rounded-md border bg-background px-3"
								>
									<option value="">Pilih section</option><option value="news">Berita</option><option
										value="education">Edukasi</option
									>
								</select>
							</label>
						</div>
					</CardContent>
				</Card>
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
							disabled={isSubmitting}
							class="h-12 w-full gap-2 font-bold shadow-sm transition-all hover:shadow-primary/20"
						>
							{#if isSubmitting}
								<Loader2 class="h-5 w-5 animate-spin" />
								Saving...
							{:else}
								<Save size={18} />
								Create Tag
							{/if}
						</Button>

						{#if form?.message}
							<div
								class="animate-in fade-in slide-in-from-top-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
							>
								{form.message}
							</div>
						{/if}

						<Separator />

						<Button
							href="/tags"
							variant="ghost"
							type="button"
							class="w-full text-muted-foreground hover:text-foreground"
						>
							Cancel and Return
						</Button>
					</CardContent>
				</Card>

				<Card class="border-primary/10 bg-primary/5">
					<CardHeader class="pb-2">
						<CardTitle
							class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-primary uppercase"
						>
							<Globe size={12} /> Public Impact
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-[11px] leading-relaxed text-muted-foreground">
							New tags are immediately available for use in <strong>Posts</strong> and
							<strong>Tokens</strong>. They will appear as filters on the public website once
							associated with published items.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>
