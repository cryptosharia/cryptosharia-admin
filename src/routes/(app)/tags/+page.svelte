<script lang="ts">
	import { Plus, Tag, Search, Edit } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

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
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Tags</h1>
			<p class="text-muted-foreground mt-2 text-sm sm:text-base">Manage taxonomy tags for posts and items.</p>
		</div>
		<Button href="/tags/new" class="gap-2 w-full sm:w-auto">
			<Plus size={18} />
			Create Tag
		</Button>
	</div>

	<!-- Search & Filter Bar -->
	<div class="glass-card rounded-xl p-4">
		<div class="flex flex-col sm:flex-row gap-4 items-center">
			<form onsubmit={handleSearch} class="relative flex-1 w-full max-w-sm">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search tags..."
					bind:value={searchValue}
					class="pl-9 bg-background/50 border-white/10 dark:border-gray-800 focus:bg-background"
				/>
			</form>
			<div class="flex items-center gap-2">
				{#if data.search}
					<Button href="/tags" variant="ghost" size="sm" class="text-xs">Clear Filters</Button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Data Table -->
	<div class="glass-card rounded-xl overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm text-left">
				<thead class="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-white/10 dark:border-gray-800">
					<tr>
						<th class="px-6 py-4 font-medium">Name</th>
						<th class="px-6 py-4 font-medium">Slug</th>
						<th class="px-6 py-4 font-medium hidden md:table-cell">Description</th>
						<th class="px-6 py-4 font-medium text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/5 dark:divide-gray-800/50">
					{#each data.tags as tag}
						<tr class="hover:bg-muted/30 transition-colors group">
							<td class="px-6 py-3">
								<div class="flex items-center gap-3">
									<div class="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
										<Tag size={16} />
									</div>
									<span class="font-medium text-foreground">{tag.name}</span>
								</div>
							</td>
							<td class="px-6 py-3 text-muted-foreground">
								<span class="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-xs font-medium">
									{tag.slug}
								</span>
							</td>
							<td class="px-6 py-3 text-muted-foreground hidden md:table-cell max-w-xs xl:max-w-md truncate">
								{tag.description || '-'}
							</td>
							<td class="px-6 py-3 text-right">
								<Button
									href={`/tags/${tag.slug}`}
									variant="ghost"
									size="icon"
									class="h-8 w-8 text-primary shadow-sm border border-transparent hover:border-border transition-all"
								>
									<Edit size={14} />
								</Button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-6 py-12 text-center text-muted-foreground">
								<div class="flex flex-col items-center gap-2">
									<Tag class="h-8 w-8 text-muted-foreground/50" />
									<p>No tags found.</p>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		
		<!-- Pagination -->
		{#if data.pagination.totalPages > 1}
			<div class="px-6 py-4 border-t border-white/10 dark:border-gray-800 flex items-center justify-between">
				<span class="text-sm text-muted-foreground">
					Page {data.pagination.page} of {data.pagination.totalPages}
				</span>
				<div class="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={data.pagination.page <= 1}
						onclick={() => goToPage(data.pagination.page - 1)}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={data.pagination.page >= data.pagination.totalPages}
						onclick={() => goToPage(data.pagination.page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
