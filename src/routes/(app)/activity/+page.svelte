<script lang="ts">
	import { Activity, User, Clock, Database } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";
	import { Badge } from "$lib/components/ui/badge";

	let { data } = $props();

	function getActionVariant(action: string) {
		switch (action) {
			case 'CREATE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
			case 'UPDATE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
			case 'DELETE': return 'bg-destructive/10 text-destructive border-destructive/20';
			default: return 'bg-muted text-muted-foreground border-muted';
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Activity Logs</h1>
		<p class="text-muted-foreground mt-2">Audit trail of all administrative actions.</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>System Activity</CardTitle>
			<CardDescription>A chronological list of actions performed by administrators.</CardDescription>
		</CardHeader>
		<CardContent>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Action</Table.Head>
						<Table.Head>Admin</Table.Head>
						<Table.Head>Subject</Table.Head>
						<Table.Head>Details</Table.Head>
						<Table.Head>Timestamp</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.logs as log}
						<Table.Row>
							<Table.Cell>
								<Badge variant="outline" class="text-[10px] font-bold {getActionVariant(log.action)}">
									{log.action}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<User size={14} class="text-muted-foreground" />
									<div>
										<p class="font-medium text-sm">{log.adminName || 'System'}</p>
										<p class="text-xs text-muted-foreground">{log.adminEmail || ''}</p>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<Database size={14} class="text-muted-foreground" />
									<span class="text-sm capitalize">{log.subjectType}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								<p class="text-sm text-muted-foreground">
									{log.description?.name ? `Target: ${log.description.name}` : 'No details'}
								</p>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2 text-muted-foreground text-xs">
									<Clock size={12} />
									{new Date(log.createdAt).toLocaleString()}
								</div>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">
								No activity logs found.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</CardContent>
	</Card>
</div>

