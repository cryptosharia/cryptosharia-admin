<script lang="ts">
	import { ArrowLeft, Save, Loader2, Tag, Info, Globe } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { enhance } from '$app/forms';

	let { form } = $props();
	let isSubmitting = $state(false);

	let name = $state('');
	let slug = $state('');

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

<div class="space-y-6 max-w-5xl mx-auto">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/tags" variant="outline" size="icon" class="rounded-full shadow-sm hover:shadow-md transition-all">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Create Tag</h1>
				<p class="text-muted-foreground mt-1 text-sm">Add a new tag for categorizing items across the platform.</p>
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
									placeholder="e.g. Education, DeFi, Halal"
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
										placeholder="auto-generated-slug"
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
								placeholder="What is this tag used for? (Optional)"
								class="min-h-[120px] resize-none focus:ring-1 focus:ring-primary/20 transition-all text-base"
							/>
							<div class="flex items-start gap-2 text-[11px] text-muted-foreground mt-2 bg-muted/50 p-2 rounded border border-border/50">
								<Info size={14} class="mt-0.5 text-primary" />
								<p>Descriptions help other admin managers understand the purpose of this tag.</p>
							</div>
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
						<Button type="submit" disabled={isSubmitting} class="w-full gap-2 h-12 font-bold shadow-sm hover:shadow-primary/20 transition-all">
							{#if isSubmitting}
								<Loader2 class="h-5 w-5 animate-spin" />
								Saving...
							{:else}
								<Save size={18} />
								Create Tag
							{/if}
						</Button>

						{#if form?.message}
							<div class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
								{form.message}
							</div>
						{/if}

						<Separator />
						
						<Button href="/tags" variant="ghost" type="button" class="w-full text-muted-foreground hover:text-foreground">
							Cancel and Return
						</Button>
					</CardContent>
				</Card>

				<Card class="bg-primary/5 border-primary/10">
					<CardHeader class="pb-2">
						<CardTitle class="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
							<Globe size={12} /> Public Impact
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-[11px] text-muted-foreground leading-relaxed">
							New tags are immediately available for use in <strong>Posts</strong> and <strong>Tokens</strong>. 
							They will appear as filters on the public website once associated with published items.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>

