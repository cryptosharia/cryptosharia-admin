<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save, Calendar, Image as ImageIcon } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Separator } from "$lib/components/ui/separator";

	let { form } = $props();

	let title = $state('');
	let slug = $state('');

	function generateSlug(str: string) {
		return str
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)+/g, '');
	}

	function handleTitleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		title = target.value;
		slug = generateSlug(title);
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
	<div class="flex items-center gap-4">
		<Button href="/posts" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">New Post</h1>
			<p class="text-muted-foreground">Create a new article or event for the platform.</p>
		</div>
	</div>

	<form method="POST" enctype="multipart/form-data" use:enhance class="space-y-8">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Editor -->
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Content Editor</CardTitle>
						<CardDescription>Primary information and article body.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="space-y-4">
							<div class="space-y-2">
								<label for="title" class="text-sm font-medium leading-none">Title</label>
								<Input
									type="text"
									id="title"
									name="title"
									required
									oninput={handleTitleInput}
									placeholder="Enter post title..."
									class="text-lg font-bold h-12"
								/>
							</div>
							<div class="space-y-2">
								<label for="slug" class="text-sm font-medium leading-none">URL Slug</label>
								<div class="flex items-center">
									<div class="px-3 py-2 bg-muted border border-r-0 rounded-l-md text-muted-foreground text-sm h-10">/posts/</div>
									<Input
										type="text"
										id="slug"
										name="slug"
										bind:value={slug}
										required
										class="rounded-l-none h-10"
									/>
								</div>
							</div>
						</div>

						<Separator />

						<div class="space-y-4">
							<div class="space-y-2">
								<label for="excerpt" class="text-sm font-medium leading-none">Excerpt</label>
								<Textarea
									id="excerpt"
									name="excerpt"
									rows={3}
									placeholder="Short summary for SEO and previews..."
									class="resize-none"
								/>
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
							Publishing
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="space-y-4">
							<div class="space-y-2">
								<label for="status" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
								<select
									id="status"
									name="status"
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="draft">Draft</option>
									<option value="published">Published</option>
									<option value="archived">Archived</option>
								</select>
							</div>

							<div class="space-y-2">
								<label for="section" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Section</label>
								<select
									id="section"
									name="section"
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="blog">Blog</option>
									<option value="news">News</option>
									<option value="event">Event</option>
									<option value="announcement">Announcement</option>
								</select>
							</div>
						</div>

						<Separator />

						<Button type="submit" class="w-full gap-2 font-bold h-12">
							<Save size={20} />
							Save Post
						</Button>

						{#if form?.message}
							<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
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
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<label for="coverImage" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cover Image Upload *</label>
							<Input
								type="file"
								id="coverImage"
								name="coverImage"
								accept="image/*"
								required
								class="bg-background/50 focus:bg-background"
							/>
						</div>
						<div class="flex items-center space-x-2">
							<input
								type="checkbox"
								id="isFeatured"
								name="isFeatured"
								class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
							/>
							<label for="isFeatured" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Feature this post</label>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-foreground/80">
							<Calendar size={18} />
							Event Details
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							<label for="eventDate" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Event Date (Optional)</label>
							<Input
								type="datetime-local"
								id="eventDate"
								name="eventDate"
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>

