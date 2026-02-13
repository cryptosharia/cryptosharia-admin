<script lang="ts">
	import { enhance } from '$app/forms';
	import { Users, Mail, Clock, Trash2, Shield, Plus, Edit3 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Users</h1>
			<p class="text-muted-foreground mt-2">Manage all registered users and administrators.</p>
		</div>
		<Button href="/users/new">
			<Plus class="mr-2 h-4 w-4" />
			Add User
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>All Users</CardTitle>
			<CardDescription>A list of all users and their roles.</CardDescription>
		</CardHeader>
		<CardContent>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>User</Table.Head>
						<Table.Head>Role</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Joined</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.users as user}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-3">
									<div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
										<Users size={20} />
									</div>
									<div>
										<p class="font-medium">{user.name || 'Anonymous'}</p>
										<p class="text-xs text-muted-foreground">{user.email}</p>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								{#if user.role}
									<Badge variant="outline" class="bg-primary/10 text-primary border-primary/20 flex w-fit items-center gap-1">
										<Shield size={12} />
										{user.role.role}
									</Badge>
								{:else}
									<span class="text-muted-foreground text-sm">User</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<Badge variant="outline" class={user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
									{user.status || 'Active'}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2 text-muted-foreground">
									<Clock size={14} />
									{new Date(user.createdAt).toLocaleDateString()}
								</div>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-2">
									<Button href="/users/{user.id}" variant="ghost" size="icon" title="Edit User">
										<Edit3 size={18} />
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="h-24 text-center">
								No users found.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</CardContent>
	</Card>
</div>
