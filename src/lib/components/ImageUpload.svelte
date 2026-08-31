<script lang="ts">
	import { ImageIcon, Upload, Pencil, Trash2, RotateCcw } from 'lucide-svelte';

	let {
		name = 'image',
		currentUrl = null as string | null,
		required = false,
		aspectRatio = 'square' as 'square' | 'video' | 'auto',
		label = 'Image'
	} = $props();

	let preview = $state<string | null>(null);
	let removeImage = $state(false);
	let fileInput = $state<HTMLInputElement>();

	function handleChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		removeImage = false;
		const reader = new FileReader();
		reader.onload = (ev) => {
			preview = ev.target?.result as string;
		};
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

	const aspectClass = $derived(
		{
			square: 'aspect-square',
			video: 'aspect-video',
			auto: 'min-h-32'
		}[aspectRatio]
	);
</script>

<div class="space-y-3">
	<!-- Preview area -->
	<div
		class="relative w-full {aspectClass} flex items-center justify-center overflow-hidden rounded-xl border border-input bg-muted/30"
	>
		{#if removeImage}
			<div class="flex flex-col items-center gap-2 p-4 text-muted-foreground">
				<Trash2 size={28} class="text-destructive opacity-30" />
				<span class="text-center text-xs text-destructive/70">Will be removed on save</span>
			</div>
		{:else if preview}
			<img src={preview} alt="Preview" class="h-full w-full object-contain p-4" />
			<span
				class="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white"
				>New</span
			>
		{:else if currentUrl}
			<img src={currentUrl} alt={label} class="h-full w-full object-contain p-4" />
			<span
				class="absolute top-2 left-2 rounded-full border border-input bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
				>Current</span
			>
		{:else}
			<div class="flex flex-col items-center gap-2 p-4 text-muted-foreground">
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
				class="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
					class="flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
				>
					<RotateCcw size={14} />
					Revert to Current
				</button>
			{/if}

			{#if currentUrl && !preview}
				<button
					type="button"
					onclick={handleRemove}
					class="flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 text-sm font-medium text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
				>
					<Trash2 size={14} />
					Remove Image
				</button>
			{/if}
		{:else}
			<button
				type="button"
				onclick={cancelRemove}
				class="flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
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
