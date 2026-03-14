<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { ArrowLeft, Plus } from 'lucide-svelte';

	let { data, form } = $props();
</script>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<Button href="/tokens" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Add New Token</h1>
			<p class="text-muted-foreground">Register a new crypto asset for Sharia compliance review.</p>
		</div>
	</div>

	<Card>
		<CardContent class="pt-6">
			<form action="?/create" method="POST" enctype="multipart/form-data" use:enhance class="space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-2">
						<label for="name" class="text-sm font-medium leading-none">Token Name</label>
						<Input
							type="text"
							id="name"
							name="name"
							required
							placeholder="e.g. Bitcoin"
						/>
					</div>

					<div class="space-y-2">
						<label for="ticker" class="text-sm font-medium leading-none">Ticker Symbol</label>
						<Input
							type="text"
							id="ticker"
							name="ticker"
							required
							placeholder="e.g. BTC"
						/>
					</div>

					<div class="space-y-2">
						<label for="shariaStatus" class="text-sm font-medium leading-none">Sharia Status</label>
						<select
							id="shariaStatus"
							name="shariaStatus"
							required
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="halal">Halal</option>
							<option value="haram">Haram</option>
							<option value="syubhat">Syubhat</option>
						</select>
					</div>

					<div class="space-y-2">
						<label for="logoImage" class="text-sm font-medium leading-none">Logo Image *</label>
						<Input
							type="file"
							id="logoImage"
							name="logoImage"
							accept="image/*"
							required
						/>
					</div>

					<div class="space-y-2">
						<label for="status" class="text-sm font-medium leading-none">Status</label>
						<select
							id="status"
							name="status"
							required
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="draft">Draft</option>
							<option value="published">Published</option>
							<option value="archived">Archived</option>
						</select>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-6 border-t">
					<Button href="/tokens" variant="ghost">Cancel</Button>
					<Button type="submit">
						<Plus size={18} class="mr-2" />
						Create Token
					</Button>
				</div>

				{#if form?.message}
					<div class="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium">
						{form.message}
					</div>
				{/if}
			</form>
		</CardContent>
	</Card>
</div>

