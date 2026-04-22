<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { X, ChevronDown, Check, Search } from 'lucide-svelte';

	let { 
		tags, 
		selectedTags = $bindable([]),
		id = undefined,
		class: className = ""
	} = $props();

	if (!Array.isArray(selectedTags)) {
		selectedTags = [];
	}

	let open = $state(false);
	let searchQuery = $state('');
	let dropdownRef: HTMLDivElement;
	let searchInput: HTMLInputElement;

	const filteredTags = $derived(
		searchQuery
			? tags.filter((t: { name: string }) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: tags
	);

	const selectedTagsObjects = $derived(
		selectedTags.map(slug => tags.find((t: { slug: string }) => t.slug === slug)).filter(Boolean)
	);

	function toggleTag(slug: string) {
		if (selectedTags.includes(slug)) {
			selectedTags = selectedTags.filter((t: string) => t !== slug);
		} else {
			selectedTags = [...selectedTags, slug];
		}
	}

	function removeTag(slug: string) {
		selectedTags = selectedTags.filter((t: string) => t !== slug);
	}

	function handleOpen() {
		open = !open;
		if (!open) searchQuery = '';
	}

	function handleClickOutside(e: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
			open = false;
			searchQuery = '';
		}
	}

	$effect(() => {
		if (open) {
			document.addEventListener('mousedown', handleClickOutside);
			// focus search input when dropdown opens
			setTimeout(() => searchInput?.focus(), 10);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});
</script>

<div class="relative {className}" bind:this={dropdownRef}>
	<!-- Trigger button -->
	<button
		{id}
		type="button"
		class="flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
		onclick={handleOpen}
		aria-haspopup="listbox"
		aria-expanded={open}
	>
		<div class="flex flex-wrap gap-1.5 flex-1">
			{#if selectedTagsObjects.length === 0}
				<span class="text-muted-foreground">Select tags...</span>
			{:else}
				{#each selectedTagsObjects as tag}
					<Badge variant="secondary" class="pl-2 pr-1 py-0.5 gap-1 flex items-center text-xs">
						{tag.name}
						<button
							type="button"
							class="rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors p-0.5"
							onclick={(e) => { e.stopPropagation(); removeTag(tag.slug); }}
							aria-label="Remove {tag.name}"
						>
							<X size={10} />
						</button>
					</Badge>
				{/each}
			{/if}
		</div>
		<ChevronDown size={16} class="ml-2 shrink-0 text-muted-foreground transition-transform {open ? 'rotate-180' : ''}" />
	</button>

	<!-- Dropdown -->
	{#if open}
		<div
			class="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md animate-in fade-in slide-in-from-top-2"
			role="listbox"
			aria-multiselectable="true"
		>
			<!-- Search input -->
			<div class="flex items-center gap-2 border-b border-input px-3 py-2">
				<Search size={14} class="shrink-0 text-muted-foreground" />
				<input
					bind:this={searchInput}
					type="text"
					placeholder="Search tags..."
					bind:value={searchQuery}
					class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					onkeydown={(e) => e.key === 'Escape' && (open = false, searchQuery = '')}
				/>
				{#if searchQuery}
					<button type="button" onclick={() => searchQuery = ''} class="text-muted-foreground hover:text-foreground">
						<X size={12} />
					</button>
				{/if}
			</div>

			<!-- Options list -->
			<div class="max-h-52 overflow-y-auto p-1">
				{#if filteredTags.length === 0}
					<p class="py-3 px-3 text-sm text-muted-foreground text-center">No tags found.</p>
				{:else}
					{#each filteredTags as tag}
						{@const isSelected = selectedTags.includes(tag.slug)}
						<button
							type="button"
							role="option"
							aria-selected={isSelected}
							class="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors {isSelected ? 'bg-accent/50' : ''}"
							onclick={() => toggleTag(tag.slug)}
						>
							<div class="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input {isSelected ? 'bg-primary border-primary text-primary-foreground' : ''}">
								{#if isSelected}
									<Check size={10} />
								{/if}
							</div>
							{tag.name}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<input type="hidden" name="tags" value={selectedTags.join(',')} />
