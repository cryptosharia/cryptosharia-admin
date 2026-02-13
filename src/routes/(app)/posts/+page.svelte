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
		<CardContent>
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
					{#each data.posts as post}
						<Table.Row class="group">
							<Table.Cell>
								<div class="space-y-1">
									<p class="font-medium group-hover:text-primary transition-colors">{post.title}</p>
									<div class="flex items-center gap-2 text-xs text-muted-foreground">
										<span>by {post.authorName || 'Unknown'}</span>
										<span>•</span>
										<span>/{post.slug}</span>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="outline" class="uppercase
									{post.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
									 post.status === 'archived' ? 'bg-muted text-muted-foreground border-muted' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}">
									{post.status}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<span class="text-muted-foreground text-sm capitalize">{post.section}</span>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground text-sm">
								<div class="flex items-center gap-2">
									<Calendar size={14} />
									{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Unpublished'}
								</div>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-2">
									<Button variant="ghost" size="icon" href="/posts/{post.id}" title="Edit">
										<Edit3 size={18} />
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
		</CardContent>
	</Card>
</div>

