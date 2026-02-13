<script lang="ts">
	import { enhance } from '$app/forms';
	import { ExternalLink, Plus, Trash2, Globe } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data, form } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Footer Links</h1>
		<p class="text-muted-foreground mt-2">Manage links displayed in the website footer.</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Add Link Form -->
		<div class="lg:col-span-1">
			<Card class="sticky top-8">
				<CardHeader>
					<CardTitle>Add New Link</CardTitle>
					<CardDescription>Configure a new footer entry.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action="?/create" method="POST" use:enhance class="space-y-4">
						<div class="space-y-2">
							<label for="label" class="text-sm font-medium leading-none">Label</label>
							<Input
								type="text"
								id="label"
								name="label"
								required
								placeholder="e.g. Documentation"
							/>
						</div>
						<div class="space-y-2">
							<label for="href" class="text-sm font-medium leading-none">URL (href)</label>
							<Input
								type="text"
								id="href"
								name="href"
								required
								placeholder="https://..."
							/>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<label for="iconId" class="text-sm font-medium leading-none">Icon</label>
								<select
									id="iconId"
									name="iconId"
									required
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#each data.icons as icon}
										<option value={icon.id}>{icon.icon}</option>
									{/each}
								</select>
							</div>
							<div class="space-y-2">
								<label for="displayOrder" class="text-sm font-medium leading-none">Order</label>
								<Input
									type="number"
									id="displayOrder"
									name="displayOrder"
									placeholder="0"
								/>
							</div>
						</div>
						<Button type="submit" class="w-full">
							<Plus size={18} class="mr-2" />
							Add Link
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>

		<!-- Links List -->
		<div class="lg:col-span-2">
			<Card>
				<CardHeader>
					<CardTitle>Active Links</CardTitle>
					<CardDescription>Links currently visible in the application footer.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Label</Table.Head>
								<Table.Head>URL</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.links as link}
								<Table.Row>
									<Table.Cell>
										<div class="flex items-center gap-3">
											<Globe size={16} class="text-muted-foreground" />
											<span class="font-medium text-foreground">{link.label}</span>
										</div>
									</Table.Cell>
									<Table.Cell class="text-muted-foreground text-sm truncate max-w-[200px]">
										{link.href}
									</Table.Cell>
									<Table.Cell class="text-right">
										<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Delete link?') && e.preventDefault()}>
											<input type="hidden" name="id" value={link.id} />
											<Button type="submit" variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
												<Trash2 size={18} />
											</Button>
										</form>
									</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={3} class="h-24 text-center text-muted-foreground">
										No links found.
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</CardContent>
			</Card>
		</div>
	</div>
</div>

