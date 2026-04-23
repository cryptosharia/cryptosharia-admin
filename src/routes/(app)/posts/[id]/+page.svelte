<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		ArrowLeft,
		Save,
		Calendar,
		Image as ImageIcon,
		Trash2,
		CheckCircle2,
		Loader2
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';
	import TagSelector from '$lib/components/TagSelector.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	// Format dates for input[datetime-local]
	function formatDate(date: string | Date | null) {
		if (!date) return '';
		return new Date(date).toISOString().slice(0, 16);
	}

	let title = $state('');
	let slug = $state('');
	let selectedTags = $state<string[]>([]);

	let editorContainer: HTMLElement;
	let editor: any;
	let content = $state('');

	$effect(() => {
		if (data.post) {
			title = data.post.title || '';
			slug = data.post.slug || '';
			selectedTags = data.post.tags?.map((t: any) => t.slug) ?? [];
			if (editor && content !== data.post.content) {
				content = data.post.content || '';
				editor.setMarkdown(content);
			}
		}
	});

	function toggleTag(tagSlug: string) {
		if (selectedTags.includes(tagSlug)) {
			selectedTags = selectedTags.filter((t) => t !== tagSlug);
		} else {
			selectedTags = [...selectedTags, tagSlug];
		}
	}

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
						const toastId = toast.loading('Uploading image...');
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
								toast.success('Image uploaded successfully', { id: toastId });
							} else {
								console.error('Failed to upload image', res);
								toast.error(res.message || 'Failed to upload image', { id: toastId });
							}
						} catch (err) {
							console.error(err);
							toast.error('Network error during upload', { id: toastId });
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
			<Button href="/posts" variant="outline" size="icon" class="rounded-full">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Edit Post</h1>
				<p class="text-muted-foreground">Update article or event details.</p>
			</div>
		</div>
		<form
			action="?/delete"
			method="POST"
			use:enhance
			onsubmit={(e) =>
				!confirm('Are you sure you want to delete this post? This cannot be undone.') &&
				e.preventDefault()}
		>
			<Button
				type="submit"
				variant="ghost"
				size="icon"
				class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
			>
				<Trash2 size={20} />
			</Button>
		</form>
	</div>

	<form action="?/update" method="POST" enctype="multipart/form-data" use:enhance class="space-y-8">
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Main Editor -->
			<div class="space-y-6 lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle>Content Editor</CardTitle>
						<CardDescription>Update your article content and metadata.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="space-y-4">
							<div class="space-y-2">
								<label for="title" class="text-sm leading-none font-medium">Title</label>
								<Input
									type="text"
									id="title"
									name="title"
									bind:value={title}
									required
									minlength={1}
									maxlength={255}
									class="h-12 text-lg font-bold"
								/>
							</div>
							<div class="space-y-2">
								<label for="slug" class="text-sm leading-none font-medium">URL Slug</label>
								<div class="flex items-center">
									<div
										class="h-10 rounded-l-md border border-r-0 bg-muted px-3 py-2 text-sm text-muted-foreground"
									>
										/posts/
									</div>
									<Input
										type="text"
										id="slug"
										name="slug"
										bind:value={slug}
										required
										minlength={1}
										maxlength={255}
										class="h-10 rounded-l-none"
									/>
								</div>
							</div>
						</div>

						<Separator />

						<div class="space-y-4">
							<div class="space-y-2">
								<label for="tags-selector" class="text-sm leading-none font-medium">Tags</label>
								<TagSelector id="tags-selector" tags={data.tags} bind:selectedTags />
								<p class="text-xs text-muted-foreground">Select relevant tags for this post.</p>
							</div>
							<div class="space-y-2">
								<label for="excerpt" class="text-sm leading-none font-medium">Excerpt</label>
								<Textarea id="excerpt" name="excerpt" rows={3} minlength={1} class="resize-none"
									>{data.post.excerpt || ''}</Textarea
								>
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
							Publishing
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
									value={data.post.status}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="draft">Draft</option>
									<option value="published">Published</option>
									<option value="archived">Archived</option>
								</select>
							</div>

							<div class="space-y-2">
								<label
									for="section"
									class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
									>Section</label
								>
								<select
									id="section"
									name="section"
									value={data.post.section}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="news">News</option>
									<option value="education">Education</option>
									<option value="research">Research</option>
									<option value="activity">Activity</option>
								</select>
							</div>

							<div class="space-y-2">
								<label
									for="type"
									class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
									>Type</label
								>
								<select
									id="type"
									name="type"
									value={data.post.type}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="article">Article</option>
									<option value="webinar">Webinar</option>
									<option value="video">Video</option>
									<option value="headline">Headline</option>
								</select>
							</div>
						</div>

						<Separator />

						<Button type="submit" class="h-12 w-full gap-2 font-bold">
							<Save size={20} />
							Update Post
						</Button>

						{#if form?.message && !(form as any).success}
							<div
								class="animate-in fade-in slide-in-from-top-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
							>
								{form.message}
							</div>
						{/if}
						{#if form?.success}
							<div
								class="animate-in fade-in slide-in-from-top-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
							>
								<div class="flex items-center gap-2">
									<CheckCircle2 size={16} />
									{form.message}
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
						<ImageUpload
							name="coverImage"
							label="Cover Image"
							currentUrl={data.post.coverImage ?? null}
							aspectRatio="video"
						/>
						<div class="flex items-center space-x-2 pt-1">
							<input
								type="checkbox"
								id="isFeatured"
								name="isFeatured"
								checked={data.post.isFeatured}
								class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
							/>
							<label for="isFeatured" class="text-sm leading-none font-medium"
								>Feature this post</label
							>
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
							<label
								for="eventDate"
								class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
								>Event Date (Optional)</label
							>
							<Input
								type="datetime-local"
								id="eventDate"
								name="eventDate"
								value={formatDate(data.post.eventDate)}
							/>
						</div>
						<div class="mt-4 space-y-2">
							<label
								for="externalLink"
								class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
								>External Link (Optional)</label
							>
							<Input
								type="url"
								id="externalLink"
								name="externalLink"
								value={data.post.externalLink || ''}
								placeholder="https://..."
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>
