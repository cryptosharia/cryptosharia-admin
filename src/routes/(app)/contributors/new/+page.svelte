<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save, Users } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { Textarea } from "$lib/components/ui/textarea";

	let { form } = $props();
</script>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<Button href="/contributors" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Add New Contributor</h1>
			<p class="text-muted-foreground">Add a new member to the CryptoSharia team.</p>
		</div>
	</div>

	<Card>
		<CardContent class="pt-6">
			<form method="POST" use:enhance class="space-y-6">
				<div class="grid grid-cols-1 gap-6">
					<div class="space-y-2">
						<label for="name" class="text-sm font-medium leading-none">Full Name</label>
						<Input
							type="text"
							id="name"
							name="name"
							required
							placeholder="e.g. Ahmad Fauzi"
						/>
					</div>

					<div class="space-y-2">
						<label for="role" class="text-sm font-medium leading-none">Role / Position</label>
						<Input
							type="text"
							id="role"
							name="role"
							required
							placeholder="e.g. Sharia Advisor"
						/>
					</div>

					<div class="space-y-2">
						<label for="bio" class="text-sm font-medium leading-none">Bio</label>
						<Textarea
							id="bio"
							name="bio"
							rows={4}
							placeholder="Short biography..."
							class="resize-none"
						/>
					</div>

					<div class="space-y-2">
						<label for="photoUrl" class="text-sm font-medium leading-none">Photo URL</label>
						<Input
							type="url"
							id="photoUrl"
							name="photoUrl"
							placeholder="https://..."
						/>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
						<div class="space-y-2">
							<label for="displayOrder" class="text-sm font-medium leading-none">Display Order</label>
							<Input
								type="number"
								id="displayOrder"
								name="displayOrder"
								placeholder="0"
							/>
						</div>

						<div class="flex items-center space-x-2 h-10">
							<input
								type="checkbox"
								id="isActive"
								name="isActive"
								checked
								class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
							/>
							<label for="isActive" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Active Member</label>
						</div>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-6 border-t">
					<Button href="/contributors" variant="ghost">Cancel</Button>
					<Button type="submit" class="gap-2">
						<Save size={18} />
						Create Contributor
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

