<script lang="ts">
	import { ShieldCheck, Plus, MoreVertical, Edit3 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Admins</h1>
			<p class="text-muted-foreground mt-2">Manage system administrators and their roles.</p>
		</div>
		<Button href="/admins/new" class="flex items-center gap-2">
			<Plus size={18} />
			Add Admin
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Administrative Team</CardTitle>
			<CardDescription>Users with access to the management console.</CardDescription>
		</CardHeader>
		<CardContent>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>User</Table.Head>
						<Table.Head>Role</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Last Login</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.admins as admin}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center gap-3">
									<div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
										<ShieldCheck size={20} />
									</div>
									<div>
										<p class="font-medium">{admin.name}</p>
										<p class="text-xs text-muted-foreground">{admin.email}</p>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary">
									{admin.roleName || 'No Role'}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="outline" class={admin.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
									{admin.status === 'active' ? 'Active' : 'Inactive'}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground text-sm">
								{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : 'Never'}
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button variant="ghost" size="icon" href="/admins/{admin.id}">
									<Edit3 size={18} />
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">
								No admins found.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</CardContent>
	</Card>
</div>

