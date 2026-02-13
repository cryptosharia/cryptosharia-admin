<script lang="ts">
	import { enhance } from '$app/forms';
	import { FileText, Plus, Trash2 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data, form } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Tags</h1>
		<p class="text-muted-foreground mt-2">Manage tags for token categorization.</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Add Tag Form -->
		<div class="lg:col-span-1">
			<Card class="sticky top-8">
				<CardHeader>
					<CardTitle>Add New Tag</CardTitle>
					<CardDescription>Create a new category for evaluation.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action="?/create" method="POST" use:enhance class="space-y-4">
						<div class="space-y-2">
							<label for="name" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Tag Name</label>
							<Input
								id="name"
								name="name"
								required
								placeholder="e.g. DeFi"
								class="w-full"
							/>
						</div>
						<Button type="submit" class="w-full">
							<Plus size={18} class="mr-2" />
							Add Tag
						</Button>
						{#if form?.message}
							<p class="text-sm text-destructive mt-2">{form.message}</p>
						{/if}
					</form>
				</CardContent>
			</Card>
		</div>

		<!-- Tags List -->
		<div class="lg:col-span-2">
			<Card>
				<CardHeader>
					<CardTitle>Existing Tags</CardTitle>
					<CardDescription>Manage your current set of evaluation tags.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Name</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.tags as tag}
								<Table.Row>
									<Table.Cell>
										<div class="flex items-center gap-3">
											<FileText size={16} class="text-muted-foreground" />
											<span class="font-medium text-foreground">{tag.name}</span>
										</div>
									</Table.Cell>
									<Table.Cell class="text-right">
										<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Delete tag?') && e.preventDefault()}>
											<input type="hidden" name="id" value={tag.id} />
											<Button type="submit" variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
												<Trash2 size={18} />
											</Button>
										</form>
									</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell colspan={2} class="h-24 text-center text-muted-foreground">
										No tags found.
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

