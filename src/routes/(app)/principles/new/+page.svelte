<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save, BookOpen } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { Textarea } from "$lib/components/ui/textarea";

	let { data, form } = $props();
</script>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<Button href="/principles" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Add New Principle</h1>
			<p class="text-muted-foreground">Define a new Sharia evaluation principle.</p>
		</div>
	</div>

	<Card>
		<CardContent class="pt-6">
			<form method="POST" use:enhance class="space-y-6">
				<div class="grid grid-cols-1 gap-6">
					<div class="space-y-2">
						<label for="title" class="text-sm font-medium leading-none">Title</label>
						<Input
							type="text"
							id="title"
							name="title"
							required
							placeholder="e.g. No Riba"
						/>
					</div>

					<div class="space-y-2">
						<label for="description" class="text-sm font-medium leading-none">Description</label>
						<Textarea
							id="description"
							name="description"
							required
							rows={4}
							placeholder="Explain this principle..."
							class="resize-none"
						/>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-2">
							<label for="colorHex" class="text-sm font-medium leading-none">Theme Color</label>
							<div class="flex gap-2">
								<input
									type="color"
									value="#eab308"
									class="h-10 w-12 rounded-md cursor-pointer bg-background border border-input p-1"
									oninput={(e) => {
										const input = document.getElementById('colorHex') as HTMLInputElement;
										if(input) input.value = e.currentTarget.value;
									}}
								/>
								<Input
									type="text"
									id="colorHex"
									name="colorHex"
									required
									placeholder="#eab308"
									class="flex-1"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<label for="displayOrder" class="text-sm font-medium leading-none">Display Order</label>
							<Input
								type="number"
								id="displayOrder"
								name="displayOrder"
								placeholder="0"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<label for="iconId" class="text-sm font-medium leading-none">Icon</label>
						<select
							id="iconId"
							name="iconId"
							required
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="" disabled selected>Select an icon</option>
							{#each data.icons as icon}
								<option value={icon.id}>{icon.icon} ({icon.type})</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-6 border-t">
					<Button href="/principles" variant="ghost">Cancel</Button>
					<Button type="submit" class="gap-2">
						<Save size={18} />
						Create Principle
					</Button>
				</div>

				{#if form?.message}
					<div class="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium animate-in fade-in slide-in-from-top-2">
						{form.message}
					</div>
				{/if}
			</form>
		</CardContent>
	</Card>
</div>

