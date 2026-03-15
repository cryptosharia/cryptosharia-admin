<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2, Save, ArrowLeft, CheckCircle2 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { Separator } from "$lib/components/ui/separator";

	let { data, form } = $props();
	let { token } = data;
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/tokens" variant="outline" size="icon" class="rounded-full">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Edit Token</h1>
				<p class="text-muted-foreground">{token.name} ({token.ticker})</p>
			</div>
		</div>
		
		<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Are you sure you want to delete this token?') && e.preventDefault()}>
			<Button type="submit" variant="destructive" class="gap-2">
				<Trash2 size={18} />
				Delete Token
			</Button>
		</form>
	</div>

	<Card>
		<CardContent class="pt-6">
			<form action="?/update" method="POST" use:enhance class="space-y-8">
				<!-- Core Info -->
				<div class="space-y-4">
					<div class="flex items-center gap-2">
						<div class="h-1 w-8 bg-primary rounded-full"></div>
						<h2 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">Core Information</h2>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-2">
							<label for="name" class="text-sm font-medium leading-none">Name</label>
							<Input
								type="text"
								id="name"
								name="name"
								required
								value={token.name}
							/>
						</div>

						<div class="space-y-2">
							<label for="ticker" class="text-sm font-medium leading-none">Ticker Symbol</label>
							<Input
								type="text"
								id="ticker"
								name="ticker"
								required
								value={token.ticker}
							/>
						</div>

						<div class="space-y-2">
							<label for="shariaStatus" class="text-sm font-medium leading-none">Sharia Status</label>
							<select
								id="shariaStatus"
								name="shariaStatus"
								required
								value={token.shariaStatus}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="halal">Halal</option>
								<option value="haram">Haram</option>
								<option value="syubhat">Syubhat</option>
							</select>
						</div>

                        <div class="space-y-2">
							<label for="status" class="text-sm font-medium leading-none">Status</label>
							<select
								id="status"
								name="status"
								required
								value={token.status}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="draft">Draft</option>
								<option value="published">Published</option>
								<option value="archived">Archived</option>
							</select>
						</div>
					</div>
				</div>

				<Separator />

				<div class="flex justify-end gap-3 pt-6 border-t">
					<Button href="/tokens" variant="ghost">Cancel</Button>
					<Button type="submit" class="gap-2">
						<Save size={18} />
						Save Changes
					</Button>
				</div>

				{#if form?.message && !form?.success}
					<div class="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium animate-in fade-in slide-in-from-top-2">
						{form.message}
					</div>
				{/if}
				
				{#if form?.success}
					<div class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in slide-in-from-top-2">
						<div class="flex items-center gap-2">
							<CheckCircle2 size={18} />
							Token updated successfully!
						</div>
					</div>
				{/if}
			</form>
		</CardContent>
	</Card>
</div>

