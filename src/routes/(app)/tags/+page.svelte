<script lang="ts">
	import {
		Plus,
		Tag,
		Search,
		Edit,
		ArrowDown,
		ArrowUp,
		ArrowUpDown,
		SlidersHorizontal
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let searchValue = $state('');
	let publicFilter = $state('');
	let sectionFilter = $state('');
	$effect(() => {
		searchValue = data.search || '';
	});
	$effect(() => {
		publicFilter = data.publicFilter || '';
	});
	$effect(() => {
		sectionFilter = data.section || '';
	});

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

	function applyFilters() {
		const params = new URLSearchParams($page.url.searchParams);
		for (const [key, value] of Object.entries({ public: publicFilter, section: sectionFilter })) {
			if (value) params.set(key, value);
			else params.delete(key);
		}
		params.set('page', '1');
		goto(`?${params.toString()}`);
	}

	function sortBy(column: 'name' | 'slug' | 'description' | 'showInNavigation') {
		const params = new URLSearchParams($page.url.searchParams);
		const isCurrentColumn = params.get('sort') === column;
		params.set('sort', column);
		params.set('direction', isCurrentColumn && params.get('direction') === 'asc' ? 'desc' : 'asc');
		params.set('page', '1');
		goto(`?${params.toString()}`);
	}

	function hasActiveFilters() {
		return Boolean(data.search || data.publicFilter || data.section);
	}

	function enhancePublicToggle({ formData, cancel }: { formData: FormData; cancel: () => void }) {
		const isPublic = formData.get('showInNavigation') === 'on';
		if (isPublic && !formData.get('contentSection')) {
			cancel();
			toast.error('Pilih bagian Berita atau Edukasi terlebih dahulu.');
			return;
		}

		return async ({
			result,
			update
		}: {
			result: { type: string; data?: { message?: string } };
			update: () => Promise<void>;
		}) => {
			if (result.type === 'success') {
				toast.success(result.data?.message || 'Status kategori diperbarui.');
				await update();
			} else {
				toast.error(result.data?.message || 'Status kategori gagal diperbarui.');
			}
		};
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Tags</h1>
			<p class="mt-2 text-sm text-muted-foreground sm:text-base">
				Manage taxonomy tags for posts and items.
			</p>
		</div>
		<Button href="/tags/new" class="w-full gap-2 sm:w-auto">
			<Plus size={18} />
			Create Tag
		</Button>
	</div>

	<!-- Search & Filter Bar -->
	<div class="glass-card rounded-xl p-4">
		<div class="flex flex-col gap-3">
			<form onsubmit={handleSearch} class="relative w-full max-w-sm flex-1">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search tags..."
					bind:value={searchValue}
					class="border-white/10 bg-background/50 pl-9 focus:bg-background dark:border-gray-800"
				/>
			</form>
			<div class="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center">
				<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<SlidersHorizontal size={16} />
					Filters
				</div>
				<div class="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
					<select
						bind:value={publicFilter}
						onchange={applyFilters}
						aria-label="Filter tampil publik"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm"
					>
						<option value="">Semua status publik</option>
						<option value="shown">Tampil publik</option>
						<option value="hidden">Tidak tampil publik</option>
					</select>
					<select
						bind:value={sectionFilter}
						onchange={applyFilters}
						aria-label="Filter bagian publik"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm"
					>
						<option value="">Semua bagian</option>
						<option value="news">Berita</option>
						<option value="education">Edukasi</option>
					</select>
				</div>
				{#if hasActiveFilters()}
					<Button href="/tags" variant="ghost" size="sm" class="text-xs">Clear Filters</Button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Data Table -->
	<div class="glass-card overflow-hidden rounded-xl">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead
					class="border-b border-white/10 bg-muted/30 text-xs text-muted-foreground uppercase dark:border-gray-800"
				>
					<tr>
						<th class="px-6 py-4 font-medium"
							><button
								type="button"
								class="flex items-center gap-1 hover:text-foreground"
								onclick={() => sortBy('name')}
								>Name {#if data.sort === 'name'}{#if data.direction === 'asc'}<ArrowUp
											size={14}
										/>{:else}<ArrowDown size={14} />{/if}{:else}<ArrowUpDown
										size={14}
									/>{/if}</button
							></th
						>
						<th class="px-6 py-4 font-medium"
							><button
								type="button"
								class="flex items-center gap-1 hover:text-foreground"
								onclick={() => sortBy('slug')}
								>Slug {#if data.sort === 'slug'}{#if data.direction === 'asc'}<ArrowUp
											size={14}
										/>{:else}<ArrowDown size={14} />{/if}{:else}<ArrowUpDown
										size={14}
									/>{/if}</button
							></th
						>
						<th class="hidden px-6 py-4 font-medium md:table-cell"
							><button
								type="button"
								class="flex items-center gap-1 hover:text-foreground"
								onclick={() => sortBy('description')}
								>Description {#if data.sort === 'description'}{#if data.direction === 'asc'}<ArrowUp
											size={14}
										/>{:else}<ArrowDown size={14} />{/if}{:else}<ArrowUpDown
										size={14}
									/>{/if}</button
							></th
						>
						<th class="hidden px-6 py-4 font-medium lg:table-cell"
							><button
								type="button"
								class="flex items-center gap-1 hover:text-foreground"
								onclick={() => sortBy('showInNavigation')}
								>Tampil Publik {#if data.sort === 'showInNavigation'}{#if data.direction === 'asc'}<ArrowUp
											size={14}
										/>{:else}<ArrowDown size={14} />{/if}{:else}<ArrowUpDown
										size={14}
									/>{/if}</button
							></th
						>
						<th class="px-6 py-4 text-right font-medium">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/5 dark:divide-gray-800/50">
					{#each data.tags as tag}
						{@const categoryTag = tag as typeof tag & {
							showInNavigation?: boolean;
							contentSection?: string | null;
							displayOrder?: number | null;
						}}
						<tr class="group transition-colors hover:bg-muted/30">
							<td class="px-6 py-3">
								<div class="flex items-center gap-3">
									<div class="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
										<Tag size={16} />
									</div>
									<span class="font-medium text-foreground">{tag.name}</span>
								</div>
							</td>
							<td class="px-6 py-3 text-muted-foreground">
								<span
									class="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium"
								>
									{tag.slug}
								</span>
							</td>
							<td
								class="hidden max-w-xs truncate px-6 py-3 text-muted-foreground md:table-cell xl:max-w-md"
							>
								{tag.description || '-'}
							</td>
							<td class="hidden px-6 py-3 lg:table-cell">
								<form
									method="POST"
									action="?/togglePublic"
									use:enhance={enhancePublicToggle}
									class="flex items-center gap-2"
								>
									<input type="hidden" name="slug" value={tag.slug} />
									<input type="hidden" name="displayOrder" value={categoryTag.displayOrder ?? 99} />
									<select
										name="contentSection"
										value={categoryTag.contentSection ?? ''}
										aria-label={`Bagian publik untuk ${tag.name}`}
										class="h-8 max-w-24 rounded border bg-background px-1 text-xs"
									>
										<option value="">Bagian</option>
										<option value="news">Berita</option>
										<option value="education">Edukasi</option>
									</select>
									<input
										type="checkbox"
										name="showInNavigation"
										checked={categoryTag.showInNavigation ?? false}
										onchange={(event) => event.currentTarget.form?.requestSubmit()}
										aria-label={`${tag.name} tampil di navigasi publik`}
										class="h-4 w-4 accent-primary"
									/>
									{#if categoryTag.showInNavigation}
										<span class="text-xs text-emerald-600 dark:text-emerald-400"
											>Tampil · #{categoryTag.displayOrder ?? '-'}</span
										>
									{/if}
								</form>
							</td>
							<td class="px-6 py-3 text-right">
								<Button
									href={`/tags/${tag.slug}`}
									variant="ghost"
									size="icon"
									class="h-8 w-8 border border-transparent text-primary shadow-sm transition-all hover:border-border"
								>
									<Edit size={14} />
								</Button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-6 py-12 text-center text-muted-foreground">
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
			<div
				class="flex items-center justify-between border-t border-white/10 px-6 py-4 dark:border-gray-800"
			>
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
