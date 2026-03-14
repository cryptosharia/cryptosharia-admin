<script lang="ts">
	import { FileText, Plus, Calendar, Edit3, Eye } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Posts & Articles</h1>
			<p class="text-muted-foreground mt-2">Manage blog posts, events, and other content.</p>
		</div>
		<Button href="/posts/new" class="flex items-center gap-2">
			<Plus size={18} />
			Create Post
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Recent Posts</CardTitle>
			<CardDescription>View and manage all your content across different sections.</CardDescription>
		</CardHeader>
		<CardContent class="p-0 md:p-6">
			<div class="hidden md:block overflow-x-auto">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Title</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Section</Table.Head>
						<Table.Head>Published</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.posts || [] as post}
						<Table.Row class="group">
							<Table.Cell>
								<div class="space-y-1">
									<p class="font-medium group-hover:text-primary transition-colors">{post.title}</p>
									<div class="flex items-center gap-2 text-xs text-muted-foreground">
										<span>{post.authorName}</span>
										<span>•</span>
										<span class="font-mono text-[10px]">{post.slug}</span>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="outline" class="capitalize
									{post.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/30' : 
									 post.status === 'archived' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900/30'}">
									{post.status}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<span class="text-sm capitalize px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
									{post.section}
								</span>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<Calendar size={14} />
									<span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-2">
									<Button variant="ghost" size="icon" href={`/posts/${post.id}`}>
										<Edit3 size={16} />
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="h-24 text-center">
								<div class="flex flex-col items-center gap-2">
									<div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
										<FileText size={20} />
									</div>
									<p class="text-muted-foreground">No posts found. Start writing!</p>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
			</div>
			
			<!-- Mobile Cards View -->
			<div class="grid grid-cols-1 gap-4 md:hidden p-4">
				{#each data.posts || [] as post}
					<div class="flex flex-col gap-3 p-4 rounded-xl border bg-card text-card-foreground shadow-sm relative">
						<div class="flex items-start justify-between gap-2">
							<div class="space-y-1 pr-8">
								<p class="font-medium text-base leading-tight">{post.title}</p>
								<div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
									<span>{post.authorName}</span>
									<span>•</span>
									<span class="font-mono text-[10px] truncate max-w-[120px]">{post.slug}</span>
								</div>
							</div>
							<Button variant="ghost" size="icon" href={`/posts/${post.id}`} class="absolute top-3 right-3 h-8 w-8 text-primary shrink-0">
								<Edit3 size={16} />
							</Button>
						</div>
						
						<div class="flex flex-wrap items-center gap-2 mt-2">
							<Badge variant="outline" class="capitalize text-[10px]
								{post.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/30' : 
								 post.status === 'archived' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900/30'}">
								{post.status}
							</Badge>
							<span class="text-[10px] uppercase font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
								{post.section}
							</span>
							<div class="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
								<Calendar size={12} />
								<span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}</span>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
						<div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
							<FileText size={24} />
						</div>
						<p class="font-medium">No posts found</p>
						<p class="text-xs mt-1">Start writing your first post!</p>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>

