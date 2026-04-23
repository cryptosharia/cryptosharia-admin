<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ArrowLeft, Plus, ImageIcon, Save } from 'lucide-svelte';
	import TagSelector from '$lib/components/TagSelector.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';

	let { data, form } = $props();

	let name = $state('');
	let slug = $state('');
	let selectedTags = $state<string[]>([]);

	function generateSlug(str: string) {
		return str
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)+/g, '');
	}

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		name = target.value;
		slug = generateSlug(name);
	}

	let editorContainer: HTMLElement;
	let editor: any;
	let content = $state('');

	$effect(() => {
		const initEditor = async () => {
			const Editor = (await import('@toast-ui/editor')).default;
			await import('@toast-ui/editor/dist/toastui-editor.css');
			await import('@toast-ui/editor/dist/theme/toastui-editor-dark.css');

			editor = new Editor({
				el: editorContainer,
				height: '500px',
				initialEditType: 'markdown',
				previewStyle: 'vertical',
				theme: 'dark',
				initialValue: content,
				events: {
					change: () => {
						content = editor.getMarkdown();
					}
				},
				hooks: {
					addImageBlobHook: async (
						blob: Blob,
						callback: (url: string, altText: string) => void
					) => {
						const formData = new FormData();
						const fileName = (blob as File).name || 'upload.png';
						formData.append('image', blob, fileName);
						try {
							const response = await fetch('/api/imgbb', {
								method: 'POST',
								body: formData
							});
							const res = await response.json();
							if (res.success && res.url) {
								const altText = document.getElementById('toastuiAltTextInput')?.value || '';
								callback(res.url, altText);
							} else {
								console.error('Failed to upload image', res);
							}
						} catch (err) {
							console.error(err);
						}
					}
				}
			});
		};

		if (typeof window !== 'undefined' && editorContainer && !editor) {
			initEditor();
		}

		return () => {
			if (editor) editor.destroy();
		};
	});
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/tokens" variant="outline" size="icon" class="rounded-full">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Add New Token</h1>
				<p class="text-muted-foreground">
					Register a new crypto asset for Sharia compliance review.
				</p>
			</div>
		</div>
	</div>

	<form action="?/create" method="POST" enctype="multipart/form-data" use:enhance class="space-y-8">
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Main Editor -->
			<div class="space-y-6 lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle>Token Information</CardTitle>
						<CardDescription>Enter the token details and content.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<label for="name" class="text-sm leading-none font-medium">Token Name</label>
								<Input
									type="text"
									id="name"
									name="name"
									required
									minlength={1}
									maxlength={100}
									placeholder="e.g. Bitcoin"
									class="h-12 text-lg font-bold"
									oninput={handleNameInput}
								/>
							</div>

							<div class="space-y-2">
								<label for="ticker" class="text-sm leading-none font-medium">Ticker Symbol</label>
								<Input
									type="text"
									id="ticker"
									name="ticker"
									required
									minlength={1}
									maxlength={20}
									placeholder="e.g. BTC"
									class="h-12 text-lg font-bold"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<label for="slug" class="text-sm leading-none font-medium">URL Slug</label>
							<div class="flex items-center">
								<div
									class="h-10 rounded-l-md border border-r-0 bg-muted px-3 py-2 text-sm text-muted-foreground"
								>
									/tokens/
								</div>
								<Input
									type="text"
									id="slug"
									name="slug"
									bind:value={slug}
									required
									minlength={1}
									maxlength={100}
									placeholder="e.g. bitcoin"
									class="h-10 rounded-l-none"
								/>
							</div>
						</div>

						<Separator />

						<div class="space-y-4">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<label class="text-sm leading-none font-medium">Tags</label>
									<TagSelector tags={data.tags} bind:selectedTags />
									<p class="text-xs text-muted-foreground">Select relevant tags for this token.</p>
									<input type="hidden" name="tags" value={selectedTags.join(',')} />
								</div>
								<div class="space-y-2">
									<label for="tradingviewSymbol" class="text-sm leading-none font-medium"
										>TradingView Symbol</label
									>
									<Input
										type="text"
										id="tradingviewSymbol"
										name="tradingviewSymbol"
										maxlength={64}
										placeholder="e.g. BINANCE:BTCUSDT"
									/>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<label for="website" class="text-sm leading-none font-medium">Website *</label>
									<Input
										type="url"
										id="website"
										name="website"
										required
										placeholder="https://..."
									/>
								</div>
								<div class="space-y-2">
									<label for="rank" class="text-sm leading-none font-medium">Rank</label>
									<Input
										type="number"
										id="rank"
										name="rank"
										required
										min={1}
										placeholder="e.g. 1"
									/>
								</div>
							</div>

							<div class="space-y-2">
								<label for="excerpt" class="text-sm leading-none font-medium">Excerpt</label>
								<Textarea
									id="excerpt"
									name="excerpt"
									rows={3}
									required
									minlength={1}
									placeholder="Short token summary..."
									class="resize-none"
								></Textarea>
							</div>

							<div class="space-y-2">
								<label for="content" class="text-sm leading-none font-medium"
									>Body Content (Markdown)</label
								>
								<div bind:this={editorContainer}></div>
								<input type="hidden" name="content" bind:value={content} />
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
							Settings
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="space-y-4">
							<div class="space-y-2">
								<label
									for="status"
									class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
									>Status</label
								>
								<select
									id="status"
									name="status"
									required
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="draft">Draft</option>
									<option value="published">Published</option>
									<option value="archived">Archived</option>
								</select>
							</div>

							<div class="space-y-2">
								<label
									for="shariaStatus"
									class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
									>Sharia Status</label
								>
								<select
									id="shariaStatus"
									name="shariaStatus"
									required
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="halal">Halal</option>
									<option value="haram">Haram</option>
									<option value="syubhat">Syubhat</option>
								</select>
							</div>
						</div>

						<Separator />

						<Button type="submit" class="h-12 w-full gap-2 font-bold">
							<Plus size={20} />
							Create Token
						</Button>

						{#if form?.message}
							<div
								class="animate-in fade-in slide-in-from-top-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
							>
								{form.message}
							</div>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-foreground/80">
							<ImageIcon size={18} />
							Media
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ImageUpload name="logoImage" label="Logo" required={true} aspectRatio="square" />
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>
