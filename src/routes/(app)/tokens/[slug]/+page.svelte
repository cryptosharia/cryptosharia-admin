<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2, Save, ArrowLeft, CheckCircle2, ImageIcon, Link as LinkIcon } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { Separator } from "$lib/components/ui/separator";
	import { Textarea } from "$lib/components/ui/textarea";

	let { data, form } = $props();
	let { token } = data;

	let editorContainer: HTMLElement;
	let editor: any;
	let content = $state(token.content || '');

	// Keep updated when navigation changes
	$effect(() => {
		if (data.token) {
			if (editor && content !== data.token.content) {
				content = data.token.content || '';
				editor.setMarkdown(content);
			}
		}
	});

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
					addImageBlobHook: async (blob: Blob, callback: (url: string, altText: string) => void) => {
						const formData = new FormData();
						formData.append('image', blob);
						try {
							const response = await fetch('/api/imgbb', {
								method: 'POST',
								body: formData
							});
							const res = await response.json();
							if (res.success && res.url) {
								callback(res.url, 'uploaded image');
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

<div class="space-y-6 max-w-5xl mx-auto">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/tokens" variant="outline" size="icon" class="rounded-full">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Edit Token</h1>
				<p class="text-muted-foreground">{token.name} ({token.ticker})</p>
			</div>
		</div>
		
		<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Are you sure you want to delete this token? This cannot be undone.') && e.preventDefault()}>
			<Button type="submit" variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
				<Trash2 size={20} />
			</Button>
		</form>
	</div>

	<form action="?/update" method="POST" enctype="multipart/form-data" use:enhance class="space-y-8">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Editor -->
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Token Information</CardTitle>
						<CardDescription>Update the token details and content.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<label for="name" class="text-sm font-medium leading-none">Name</label>
								<Input
									type="text"
									id="name"
									name="name"
									required
									minlength={1}
									maxlength={100}
									value={token.name}
									class="text-lg font-bold h-12"
								/>
							</div>

							<div class="space-y-2">
								<label for="ticker" class="text-sm font-medium leading-none">Ticker Symbol</label>
								<Input
									type="text"
									id="ticker"
									name="ticker"
									required
									minlength={1}
									maxlength={20}
									value={token.ticker}
									class="text-lg font-bold h-12"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<label for="slug" class="text-sm font-medium leading-none">URL Slug</label>
							<div class="flex items-center">
								<div class="px-3 py-2 bg-muted border border-r-0 rounded-l-md text-muted-foreground text-sm h-10">/tokens/</div>
								<Input
									type="text"
									id="slug"
									name="slug"
									required
									minlength={1}
									maxlength={100}
									value={token.slug}
									class="rounded-l-none h-10"
								/>
							</div>
						</div>

						<Separator />

						<div class="space-y-4">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-2">
									<label for="tags" class="text-sm font-medium leading-none">Tags (comma separated)</label>
									<Input
										type="text"
										id="tags"
										name="tags"
										placeholder="e.g. halal, bitcoin, web3"
										value={token.tags?.map((t: any) => t.slug).join(', ') || ''}
									/>
								</div>
								<div class="space-y-2">
									<label for="tradingviewSymbol" class="text-sm font-medium leading-none">TradingView Symbol</label>
									<Input
										type="text"
										id="tradingviewSymbol"
										name="tradingviewSymbol"
										maxlength={64}
										placeholder="e.g. BINANCE:BTCUSDT"
										value={token.tradingviewSymbol || ''}
									/>
								</div>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-2">
									<label for="website" class="text-sm font-medium leading-none">Website</label>
									<Input
										type="url"
										id="website"
										name="website"
										placeholder="https://..."
										value={token.website || ''}
									/>
								</div>
								<div class="space-y-2">
									<label for="rank" class="text-sm font-medium leading-none">Rank</label>
									<Input
										type="number"
										id="rank"
										name="rank"
										required
										min={1}
										value={token.rank}
									/>
								</div>
							</div>

							<div class="space-y-2">
								<label for="excerpt" class="text-sm font-medium leading-none">Excerpt</label>
								<Textarea
									id="excerpt"
									name="excerpt"
									rows={3}
									required
									minlength={1}
									class="resize-none"
								>{token.excerpt || ''}</Textarea>
							</div>

							<div class="space-y-2">
								<label for="content" class="text-sm font-medium leading-none">Body Content (Markdown)</label>
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
								<label for="status" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
								<select
									id="status"
									name="status"
									required
									value={token.status}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="draft">Draft</option>
									<option value="published">Published</option>
									<option value="archived">Archived</option>
								</select>
							</div>

							<div class="space-y-2">
								<label for="shariaStatus" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sharia Status</label>
								<select
									id="shariaStatus"
									name="shariaStatus"
									required
									value={token.shariaStatus}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="halal">Halal</option>
									<option value="haram">Haram</option>
									<option value="syubhat">Syubhat</option>
								</select>
							</div>
						</div>

						<Separator />

						<Button type="submit" class="w-full gap-2 font-bold h-12">
							<Save size={20} />
							Update Token
						</Button>

						{#if form?.message && !form?.success}
							<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
								{form.message}
							</div>
						{/if}
						{#if form?.success}
							<div class="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
								<div class="flex items-center gap-2">
									<CheckCircle2 size={16} />
									Token updated successfully!
								</div>
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
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<label for="logoImage" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logo Image Upload (Optional to update)</label>
							<Input
								type="file"
								id="logoImage"
								name="logoImage"
								accept="image/*"
								class="bg-background/50 focus:bg-background"
							/>
                            {#if token.logoUrl}
                                <p class="text-xs text-muted-foreground mt-2">Current logo: <a href={token.logoUrl} target="_blank" class="underline">View</a></p>
                            {/if}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>

