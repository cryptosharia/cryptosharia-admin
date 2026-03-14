<script lang="ts">
	import { MessageSquare, Mail, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	let searchValue = $state('');
	$effect(() => { searchValue = data.search; });
	let expandedId = $state<string | null>(null);

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

	function toggleExpand(id: string) {
		expandedId = expandedId === id ? null : id;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
			<p class="text-muted-foreground mt-2">Contact form submissions from CryptoSharia users.</p>
		</div>
		<div class="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
			<MessageSquare size={16} />
			<span>{data.pagination.total} total messages</span>
		</div>
	</div>

	<!-- Search Bar -->
	<Card>
		<CardContent class="pt-4 pb-4">
			<form onsubmit={handleSearch} class="flex gap-3">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by name, email, or message..."
						bind:value={searchValue}
						class="pl-9"
					/>
				</div>
				<Button type="submit" variant="outline">Search</Button>
				{#if data.search}
					<Button href="/messages" variant="ghost">Clear</Button>
				{/if}
			</form>
		</CardContent>
	</Card>

	<!-- Messages List -->
	<Card>
		<CardHeader>
			<CardTitle>All Messages</CardTitle>
			<CardDescription>
				{#if data.search}
					Showing results for "<strong>{data.search}</strong>"
				{:else}
					A list of all contact form submissions.
				{/if}
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.messages.length === 0}
				<div class="text-center py-16 text-muted-foreground">
					<MessageSquare class="h-12 w-12 mx-auto mb-4 opacity-30" />
					<p class="font-medium">No messages found</p>
					{#if data.search}
						<p class="text-sm mt-1">Try a different search term</p>
					{/if}
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.messages as message (message.id)}
						<div
							class="border border-border rounded-lg p-4 transition-all duration-200 hover:border-orange-500/30 hover:bg-card/50 cursor-pointer"
							onclick={() => toggleExpand(message.id)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && toggleExpand(message.id)}
						>
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-start gap-3 flex-1 min-w-0">
									<div class="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold flex-shrink-0">
										{message.name?.[0]?.toUpperCase() ?? '?'}
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 flex-wrap">
											<p class="font-semibold text-foreground">{message.name}</p>
											<a
												href="mailto:{message.email}"
												class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
												onclick={(e) => e.stopPropagation()}
											>
												<Mail size={12} />
												{message.email}
											</a>
										</div>
										<p class="text-sm text-muted-foreground mt-1 {expandedId === message.id ? '' : 'line-clamp-2'}">
											{message.message}
										</p>
										{#if expandedId === message.id && message.message.length > 120}
											<p class="text-xs text-orange-500 mt-1">Click to collapse</p>
										{:else if message.message.length > 120}
											<p class="text-xs text-orange-500 mt-1">Click to read more</p>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
									<Clock size={12} />
									{new Date(message.createdAt).toLocaleDateString('id-ID', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Pagination -->
				{#if data.pagination.totalPages > 1}
					<div class="flex items-center justify-between mt-6 pt-4 border-t">
						<p class="text-sm text-muted-foreground">
							Page {data.pagination.page} of {data.pagination.totalPages}
						</p>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								disabled={data.pagination.page <= 1}
								onclick={() => goToPage(data.pagination.page - 1)}
							>
								<ChevronLeft size={16} />
							</Button>
							<Button
								variant="outline"
								size="icon"
								disabled={data.pagination.page >= data.pagination.totalPages}
								onclick={() => goToPage(data.pagination.page + 1)}
							>
								<ChevronRight size={16} />
							</Button>
						</div>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>
