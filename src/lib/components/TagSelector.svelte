<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { Input } from "$lib/components/ui/input";
	import { X, Plus, Search } from 'lucide-svelte';

	let { 
		tags, 
		selectedTags = $bindable([]),
		id = undefined,
		class: className = ""
	} = $props();

	let searchQuery = $state('');

	// Ensure selectedTags is always an array
	if (!Array.isArray(selectedTags)) {
		selectedTags = [];
	}

	const filteredTags = $derived(
		tags.filter((tag: { name: string; slug: string }) => 
			tag.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
			!selectedTags.includes(tag.slug)
		)
	);

	const selectedTagsObjects = $derived(
		selectedTags.map(slug => tags.find((t: { slug: string }) => t.slug === slug)).filter(Boolean)
	);

	function addTag(slug: string) {
		if (!selectedTags.includes(slug)) {
			selectedTags = [...selectedTags, slug];
		}
		searchQuery = '';
	}

	function removeTag(slug: string) {
		selectedTags = selectedTags.filter(t => t !== slug);
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap gap-2 min-h-10 p-2 rounded-md border border-input bg-background/50">
		{#if selectedTagsObjects.length === 0}
			<span class="text-muted-foreground text-sm py-1 px-2">No tags selected</span>
		{/if}
		{#each selectedTagsObjects as tag}
			<Badge variant="secondary" class="pl-2 pr-1 py-1 gap-1 flex items-center group">
				{tag.name}
				<button 
					type="button" 
					class="p-0.5 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
					onclick={() => removeTag(tag.slug)}
				>
					<X size={12} />
				</button>
			</Badge>
		{/each}
	</div>

	<div class="relative">
		<div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
			<Search size={16} />
		</div>
		<Input
			{id}
			type="text"
			placeholder="Search tags..."
			bind:value={searchQuery}
			class="pl-10"
		/>
	</div>

	{#if searchQuery && filteredTags.length > 0}
		<div class="flex flex-wrap gap-2 mt-2 p-2 rounded-md bg-muted/30 border border-dashed border-muted-foreground/30 animate-in fade-in slide-in-from-top-1">
			{#each filteredTags as tag}
				<button
					type="button"
					class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background border border-input text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
					onclick={() => addTag(tag.slug)}
				>
					<Plus size={12} />
					{tag.name}
				</button>
			{/each}
		</div>
	{:else if searchQuery}
		<p class="text-xs text-muted-foreground italic">No further tags matching "{searchQuery}"</p>
	{/if}
	
	{#if !searchQuery && filteredTags.length > 0}
		<div class="pt-2">
			<p class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Available Tags</p>
			<div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin">
				{#each filteredTags.slice(0, 15) as tag}
					<button
						type="button"
						class="px-2 py-1 rounded-md text-xs border border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20 transition-all"
						onclick={() => addTag(tag.slug)}
					>
						{tag.name}
					</button>
				{/each}
				{#if filteredTags.length > 15}
					<span class="text-xs text-muted-foreground self-center">...and {filteredTags.length - 15} more</span>
				{/if}
			</div>
		</div>
	{/if}
</div>

<input type="hidden" name="tags" value={selectedTags.join(',')} />
