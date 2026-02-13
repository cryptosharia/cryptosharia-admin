<script lang="ts">
	import { enhance } from '$app/forms';
	import { Smartphone, Trash2, Plus, PenTool } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import { Badge } from "$lib/components/ui/badge";

	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Icons Library</h1>
			<p class="text-muted-foreground mt-2">Manage icons used across the application (Principles, Links, Socials).</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Add Icon Form -->
		<div class="lg:col-span-1">
			<Card class="sticky top-8">
				<CardHeader>
					<CardTitle>Add New Icon</CardTitle>
					<CardDescription>Register a new icon for use in UI elements.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action="?/create" method="POST" use:enhance class="space-y-4">
						<div class="space-y-2">
							<label for="type" class="text-sm font-medium leading-none">Icon Type</label>
							<select
								id="type"
								name="type"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="lucide">Lucide (Svelte)</option>
								<option value="simple_icons">Simple Icons</option>
								<option value="svg">Raw SVG</option>
							</select>
						</div>
						<div class="space-y-2">
							<label for="icon" class="text-sm font-medium leading-none">Icon Value</label>
							<Input
								type="text"
								id="icon"
								name="icon"
								placeholder="e.g., 'Home', 'siTwitter', or <svg...>"
								required
							/>
							<div class="text-[10px] text-muted-foreground leading-tight space-y-1">
								<p>• <strong>Lucide:</strong> Component Name (e.g., 'Home')</p>
								<p>• <strong>Simple Icons:</strong> Icon ID (e.g., 'siTwitter')</p>
								<p>• <strong>SVG:</strong> Paste the full SVG code</p>
							</div>
						</div>
						<Button type="submit" class="w-full">
							<Plus size={18} class="mr-2" />
							Add Icon
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>

		<!-- Icons List -->
		<div class="lg:col-span-2">
			<Card>
				<CardHeader>
					<CardTitle>Available Icons</CardTitle>
					<CardDescription>All configured icons in the system.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Preview</Table.Head>
								<Table.Head>Name/Value</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.icons as icon}
								<Table.Row>
									<Table.Cell>
										<div class="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
											{#if icon.type === 'lucide'}
												<PenTool size={20} />
											{:else if icon.type === 'simple_icons'}
												<span class="text-xs font-bold">SI</span>
											{:else}
												<div class="w-6 h-6 overflow-hidden flex items-center justify-center">
													{@html icon.icon}
												</div>
											{/if}
										</div>
									</Table.Cell>
									<Table.Cell>
										<p class="font-medium truncate max-w-[200px]">{icon.icon}</p>
									</Table.Cell>
									<Table.Cell>
										<Badge variant="secondary" class="uppercase">
											{icon.type}
										</Badge>
									</Table.Cell>
									<Table.Cell class="text-right">
										<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Delete this icon? It might be used elsewhere.') && e.preventDefault()}>
											<input type="hidden" name="id" value={icon.id} />
											<Button type="submit" variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
												<Trash2 size={18} />
											</Button>
										</form>
									</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={4} class="h-24 text-center text-muted-foreground">
										No icons found.
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

