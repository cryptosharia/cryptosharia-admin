<script lang="ts">
	import { enhance } from '$app/forms';
	import { Shield, Lock, CheckCircle2, Plus, Trash2 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data, form } = $props();

	function hasPermission(roleId: number, permissionId: number) {
		return data.rolePermissions.some(rp => rp.roleId === roleId && rp.permissionId === permissionId);
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Roles & Permissions</h1>
		<p class="text-muted-foreground mt-2">Manage access control levels and module permissions.</p>
	</div>

	<!-- Add Role Form -->
	<Card>
		<CardHeader>
			<CardTitle>Add New Role</CardTitle>
			<CardDescription>Create a new administrative level.</CardDescription>
		</CardHeader>
		<CardContent>
			<form action="?/create" method="POST" use:enhance class="flex flex-col md:flex-row gap-4 items-end">
				<div class="flex-1 w-full space-y-2">
					<label for="name" class="text-sm font-medium leading-none">Role Name</label>
					<Input
						type="text"
						id="name"
						name="name"
						required
						placeholder="e.g. Moderator"
					/>
				</div>
				<div class="flex-1 w-full space-y-2">
					<label for="slug" class="text-sm font-medium leading-none">Slug</label>
					<Input
						type="text"
						id="slug"
						name="slug"
						required
						placeholder="e.g. moderator"
					/>
				</div>
				<Button type="submit" class="w-full md:w-auto">
					<Plus size={18} class="mr-2" />
					Add Role
				</Button>
			</form>
			{#if form?.message}
				<p class="text-sm text-destructive mt-2">{form.message}</p>
			{/if}
		</CardContent>
	</Card>

	<Card>
		<CardContent class="p-0">
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-muted/50">
							<Table.Head class="sticky left-0 bg-background z-10 w-[200px]">Permission</Table.Head>
							{#each data.roles as role}
								<Table.Head class="text-center min-w-[120px]">
									<div class="flex flex-col items-center gap-2">
										<span>{role.name}</span>
										<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Delete role?') && e.preventDefault()}>
											<input type="hidden" name="id" value={role.id} />
											<Button type="submit" variant="ghost" size="icon" class="h-6 w-6 text-muted-foreground hover:text-destructive">
												<Trash2 size={12} />
											</Button>
										</form>
									</div>
								</Table.Head>
							{/each}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.permissions as perm}
							<Table.Row>
								<Table.Cell class="sticky left-0 bg-background z-10 font-medium">
									<div>
										<p class="text-sm">{perm.name}</p>
										<p class="text-[10px] text-muted-foreground font-mono uppercase">{perm.slug}</p>
									</div>
								</Table.Cell>
								{#each data.roles as role}
									<Table.Cell class="text-center">
										<form action="?/toggle" method="POST" use:enhance>
											<input type="hidden" name="roleId" value={role.id} />
											<input type="hidden" name="permissionId" value={perm.id} />
											<button type="submit" class="inline-flex items-center justify-center transition-all hover:scale-110">
												{#if hasPermission(role.id, perm.id)}
													<div class="text-primary">
														<CheckCircle2 size={20} />
													</div>
												{:else}
													<div class="text-muted/40 hover:text-muted">
														<Lock size={16} />
													</div>
												{/if}
											</button>
										</form>
									</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</CardContent>
	</Card>
</div>

