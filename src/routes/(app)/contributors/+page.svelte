<script lang="ts">
	import { Users, Plus, MoreVertical, ExternalLink, Edit3 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";

	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Contributors</h1>
			<p class="text-muted-foreground mt-2">Manage the team and contributors behind CryptoSharia.</p>
		</div>
		<Button href="/contributors/new" class="flex items-center gap-2">
			<Plus size={18} />
			Add Contributor
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each data.contributors as contributor}
			<Card class="overflow-hidden hover:shadow-md transition-shadow">
				<CardHeader class="flex flex-row items-start justify-between space-y-0 pb-4">
					<div class="flex items-center gap-4">
						{#if contributor.photoUrl}
							<img src={contributor.photoUrl} alt={contributor.name} class="h-12 w-12 rounded-full object-cover border" />
						{:else}
							<div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground border">
								<Users size={24} />
							</div>
						{/if}
						<div>
							<CardTitle class="text-lg">{contributor.name}</CardTitle>
							<p class="text-sm font-medium text-primary">{contributor.role}</p>
						</div>
					</div>
					<Button variant="ghost" size="icon" href="/contributors/{contributor.id}">
						<Edit3 size={18} />
					</Button>
				</CardHeader>
				
				<CardContent>
					{#if contributor.bio}
						<p class="text-sm text-muted-foreground line-clamp-3 mb-4">
							{contributor.bio}
						</p>
					{/if}

					<div class="flex items-center justify-between pt-4 border-t">
						<Badge variant="outline" class="uppercase tracking-wider
							{contributor.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}">
							{contributor.isActive ? 'Active' : 'Inactive'}
						</Badge>
						<Button variant="link" size="sm" href="/contributors/{contributor.id}" class="h-auto p-0 text-xs">
							Edit Profile
						</Button>
					</div>
				</CardContent>
			</Card>
		{:else}
			<Card class="col-span-full py-12">
				<CardContent class="text-center text-muted-foreground">
					No contributors found.
				</CardContent>
			</Card>
		{/each}
	</div>
</div>

