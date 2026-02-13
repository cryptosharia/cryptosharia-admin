<script lang="ts">
	import { BookOpen, Plus, MoreVertical, Edit3 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";

	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Principles</h1>
			<p class="text-muted-foreground mt-2">Manage the core Sharia principles used for token evaluation.</p>
		</div>
		<Button href="/principles/new" class="flex items-center gap-2">
			<Plus size={18} />
			Add Principle
		</Button>
	</div>

	<div class="grid grid-cols-1 gap-4">
		{#each data.principles as principle}
			<Card class="hover:border-primary/20 transition-colors">
				<CardContent class="p-6">
					<div class="flex items-center gap-6">
						<div class="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border" style="background-color: {principle.colorHex}15; color: {principle.colorHex}; border-color: {principle.colorHex}30;">
							<BookOpen size={32} />
						</div>
						
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-3 mb-1">
								<h3 class="text-xl font-bold text-foreground leading-none">{principle.title}</h3>
								<span class="text-xs font-mono text-muted-foreground">Order: {principle.displayOrder ?? '-'}</span>
							</div>
							<p class="text-muted-foreground text-sm line-clamp-2">{principle.description}</p>
						</div>

						<div class="flex items-center gap-2">
							<Button variant="outline" size="sm" href="/principles/{principle.id}">
								Edit
							</Button>
							<Button variant="ghost" size="icon" class="text-muted-foreground">
								<MoreVertical size={18} />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		{:else}
			<Card class="py-12 border-dashed">
				<CardContent class="text-center text-muted-foreground">
					No principles found.
				</CardContent>
			</Card>
		{/each}
	</div>
</div>

