<script lang="ts">
	import { ImageIcon, Upload, Pencil, Trash2, RotateCcw } from 'lucide-svelte';

	let {
		name = 'image',
		currentUrl = null as string | null,
		required = false,
		aspectRatio = 'square' as 'square' | 'video' | 'auto',
		label = 'Image',
	} = $props();

	let preview = $state<string | null>(null);
	let removeImage = $state(false);
	let fileInput: HTMLInputElement;

	function handleChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		removeImage = false;
		const reader = new FileReader();
		reader.onload = (ev) => { preview = ev.target?.result as string; };
		reader.readAsDataURL(file);
	}

	function clearPreview() {
		preview = null;
		if (fileInput) fileInput.value = '';
	}

	function handleRemove() {
		removeImage = true;
		clearPreview();
	}

	function cancelRemove() {
		removeImage = false;
	}

	const aspectClass = {
		square: 'aspect-square',
		video: 'aspect-video',
		auto: 'min-h-32',
	}[aspectRatio];
</script>

<div class="space-y-3">
	<!-- Preview area -->
	<div class="relative w-full {aspectClass} rounded-xl overflow-hidden border border-input bg-muted/30 flex items-center justify-center">
		{#if removeImage}
			<div class="flex flex-col items-center gap-2 text-muted-foreground p-4">
				<Trash2 size={28} class="opacity-30 text-destructive" />
				<span class="text-xs text-destructive/70 text-center">Will be removed on save</span>
			</div>
		{:else if preview}
			<img src={preview} alt="Preview" class="w-full h-full object-contain p-4" />
			<span class="absolute top-2 left-2 text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">New</span>
		{:else if currentUrl}
			<img src={currentUrl} alt={label} class="w-full h-full object-contain p-4" />
			<span class="absolute top-2 left-2 text-[10px] font-semibold bg-background/80 text-muted-foreground px-2 py-0.5 rounded-full border border-input">Current</span>
		{:else}
			<div class="flex flex-col items-center gap-2 text-muted-foreground p-4">
				<ImageIcon size={32} class="opacity-20" />
				<span class="text-xs">No image{required ? ' (required)' : ''}</span>
			</div>
		{/if}
	</div>

	<!-- Action buttons -->
	<div class="grid grid-cols-1 gap-2">
		{#if !removeImage}
			<label
				for="{name}-input"
				class="flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
			>
				{#if preview}
					<Pencil size={14} />
					Change Image
				{:else if currentUrl}
					<Pencil size={14} />
					Replace Image
				{:else}
					<Upload size={14} />
					Upload Image
				{/if}
			</label>
			<input
				bind:this={fileInput}
				type="file"
				id="{name}-input"
				{name}
				accept="image/*"
				{required}
				class="sr-only"
				onchange={handleChange}
			/>

			{#if preview}
				<button
					type="button"
					onclick={clearPreview}
					class="flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors text-muted-foreground"
				>
					<RotateCcw size={14} />
					Revert to Current
				</button>
			{/if}

			{#if currentUrl && !preview}
				<button
					type="button"
					onclick={handleRemove}
					class="flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-destructive/30 bg-destructive/5 text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors text-destructive/70"
				>
					<Trash2 size={14} />
					Remove Image
				</button>
			{/if}
		{:else}
			<button
				type="button"
				onclick={cancelRemove}
				class="flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
			>
				<RotateCcw size={14} />
				Keep Current Image
			</button>
		{/if}
	</div>

	{#if removeImage}
		<input type="hidden" name="remove_{name}" value="true" />
	{/if}

	<p class="text-[10px] text-muted-foreground">PNG, JPG, SVG, WEBP supported.</p>
</div>
