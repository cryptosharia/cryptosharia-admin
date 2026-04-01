<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { FileText, Plus, Calendar, Edit3, Search, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Badge } from "$lib/components/ui/badge";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data } = $props();

	let searchValue = $state('');
	$effect(() => { searchValue = data.search || ''; });

	function handleSearch(e: Event) {
		e.preventDefault();
		const params = new URLSearchParams($page.url.searchParams);
		if (searchValue) {
			params.set('search', searchValue);
		} else {
			params.delete('search');
		}
		params.set('page', '1');
		goto(`?${params.toString()}`);
	}

	function goToPage(p: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(p));
		goto(`?${params.toString()}`);
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Posts & Articles</h1>
			<p class="text-muted-foreground mt-1 text-sm sm:text-base">Manage blog posts, events, and other content.</p>
		</div>
		<Button href="/posts/new" class="w-full sm:w-auto">
			<Plus class="mr-2 h-4 w-4" />
			Create Post
		</Button>
	</div>

	<!-- Search Bar -->
	<Card>
		<CardContent class="pt-4 pb-4">
			<form onsubmit={handleSearch} class="flex flex-col sm:flex-row gap-3">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search posts by title or slug..."
						bind:value={searchValue}
						class="pl-9 w-full"
					/>
				</div>
				<div class="flex items-center gap-2">
					<Button type="submit" variant="outline" class="flex-1 sm:flex-none">Search</Button>
					{#if data.search}
						<Button href="/posts" variant="ghost">Clear</Button>
					{/if}
				</div>
			</form>
		</CardContent>
	</Card>

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

			<!-- Pagination -->
			{#if data.pagination && data.pagination.totalPages > 1}
				<div class="flex items-center justify-between mt-4 pt-4 border-t px-4 md:px-0">
					<p class="text-sm text-muted-foreground">
						Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
					</p>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="icon" disabled={data.pagination.page <= 1} onclick={() => goToPage(data.pagination.page - 1)}>
							<ChevronLeft size={16} />
						</Button>
						<Button variant="outline" size="icon" disabled={data.pagination.page >= data.pagination.totalPages} onclick={() => goToPage(data.pagination.page + 1)}>
							<ChevronRight size={16} />
						</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

