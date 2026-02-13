<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data } = $props();
</script>

<div class="space-y-6">
	{#if data.error}
		<div class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
			<p class="font-medium">System Error</p>
			<p class="text-sm opacity-80">{data.error}. Please check your database connection.</p>
		</div>
	{/if}

	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Tokens</h1>
			<p class="text-muted-foreground mt-2">Manage your crypto tokens here.</p>
		</div>
		<Button href="/tokens/new">
			<Plus class="mr-2 h-4 w-4" />
			Add Token
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>All Tokens</CardTitle>
			<CardDescription>A list of all registered tokens in the system.</CardDescription>
		</CardHeader>
		<CardContent>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Ticker</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Rank</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.tokens as token}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-3">
									{#if token.logoUrl}
										<img src={token.logoUrl} alt={token.name} class="w-8 h-8 rounded-full" />
									{:else}
										<div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
											{token.ticker[0]}
										</div>
									{/if}
									<span>{token.name}</span>
								</div>
							</Table.Cell>
							<Table.Cell>{token.ticker}</Table.Cell>
							<Table.Cell>
								<Badge 
									variant="outline"
									class={token.shariaStatus === 'halal' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
										   token.shariaStatus === 'haram' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
										   'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}
								>
									{token.shariaStatus}
								</Badge>
							</Table.Cell>
							<Table.Cell>#{token.rank || '-'}</Table.Cell>
							<Table.Cell class="text-right">
								<Button href="/tokens/{token.slug}" variant="ghost" size="sm">Edit</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="h-24 text-center">
								No tokens found. Start by adding one!
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</CardContent>
	</Card>
</div>
