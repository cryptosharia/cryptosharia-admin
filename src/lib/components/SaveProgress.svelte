<script lang="ts">
	let { active, progress, label } = $props<{
		active: boolean;
		progress: number;
		label: string;
	}>();
</script>

{#if active}
	<div class="space-y-2 rounded-md border border-primary/20 bg-primary/10 p-3" role="status" aria-live="polite">
		<div class="flex items-center justify-between gap-3 text-xs font-medium text-primary">
			<span>{label}</span>
			<span>{progress}%</span>
		</div>
		<div
			class="h-2 overflow-hidden rounded-full bg-primary/15"
			role="progressbar"
			aria-label="Progress penyimpanan artikel"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={progress}
		>
			<div
				class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
				style:width={`${progress}%`}
			></div>
		</div>
	</div>
{/if}
