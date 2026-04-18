<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-svelte';
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
	{#if data.error}
		<div class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
			<p class="font-medium">System Error</p>
			<p class="text-sm opacity-80">{data.error}. Please check the API status.</p>
		</div>
	{/if}

	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Tokens</h1>
			<p class="text-muted-foreground mt-1 text-sm sm:text-base">Manage your crypto tokens here.</p>
		</div>
		<Button href="/tokens/new" class="w-full sm:w-auto">
			<Plus class="mr-2 h-4 w-4" />
			Add Token
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
						placeholder="Search tokens..."
						bind:value={searchValue}
						class="pl-9 w-full"
					/>
				</div>
				<div class="flex items-center gap-2">
					<Button type="submit" variant="outline" class="flex-1 sm:flex-none">Search</Button>
					{#if data.search}
						<Button href="/tokens" variant="ghost">Clear</Button>
					{/if}
				</div>
			</form>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>All Tokens</CardTitle>
			<CardDescription>A list of all registered tokens in the system.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="overflow-x-auto">
			<Table.Root class="min-w-[800px]">
				<Table.Header>
					<Table.Row>
						<Table.Head>Asset</Table.Head>
						<Table.Head>Ticker</Table.Head>
						<Table.Head>Sharia Compliance</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Rank</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.tokens || [] as token}
						<Table.Row class="group">
							<Table.Cell>
								<div class="flex items-center gap-3 font-medium">
									{#if token.logoUrl}
										<img src={token.logoUrl} alt={token.name} class="w-8 h-8 rounded-full bg-secondary" />
									{:else}
										<div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
											{token.ticker?.[0] || '?'}
										</div>
									{/if}
									<span>{token.name}</span>
								</div>
							</Table.Cell>
							<Table.Cell>{token.ticker}</Table.Cell>
							<Table.Cell>
								<Badge 
									variant="outline"
									class="capitalize {token.shariaStatus === 'halal' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
										   token.shariaStatus === 'haram' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
										   'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}"
								>
									{token.shariaStatus}
								</Badge>
							</Table.Cell>
							<Table.Cell>
                                <span class="capitalize text-sm text-muted-foreground">{token.status}</span>
                            </Table.Cell>
							<Table.Cell>#{token.rank || '-'}</Table.Cell>
							<Table.Cell class="text-right">
								<Button href={`/tokens/${token.slug}`} variant="ghost" size="icon" class="h-8 w-8 text-primary shadow-sm border border-transparent hover:border-border transition-all">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={6} class="h-24 text-center">
								No tokens found. Start by adding one!
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
			</div>

			<!-- Pagination -->
			{#if data.pagination && data.pagination.totalPages > 1}
				<div class="flex items-center justify-between mt-4 pt-4 border-t">
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
