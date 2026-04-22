<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Users as UsersIcon, Mail, Clock, Trash2, Shield, Plus, Edit3, Search } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Badge } from "$lib/components/ui/badge";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import * as Table from "$lib/components/ui/table";

	let { data } = $props();

	let searchValue = $state('');
	$effect(() => { searchValue = data.search || ''; });

	function handleSearch(e: Event) {
		e.preventDefault();
		const params = new URLSearchParams($page.url.searchParams);
		if (searchValue) {
			params.set('search', searchValue);
		} else {
			params.delete('search');
		}
		params.set('page', '1');
		goto(`?${params.toString()}`);
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Users</h1>
			<p class="text-muted-foreground mt-1 text-sm sm:text-base">Manage all registered users and administrators.</p>
		</div>
	</div>

	<!-- Search Bar -->
	<Card>
		<CardContent class="pt-4 pb-4">
			<form onsubmit={handleSearch} class="flex flex-col sm:flex-row gap-3">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search users..."
						bind:value={searchValue}
						class="pl-9 w-full"
					/>
				</div>
				<div class="flex items-center gap-2">
					<Button type="submit" variant="outline" class="flex-1 sm:flex-none">Search</Button>
					{#if data.search}
						<Button href="/users" variant="ghost">Clear</Button>
					{/if}
				</div>
			</form>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>All Users</CardTitle>
			<CardDescription>A list of all users and their roles.</CardDescription>
		</CardHeader>
		<CardContent class="p-0 md:p-6">
			<div class="hidden md:block overflow-x-auto">
			<Table.Root class="min-w-[600px]">
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
					{#each data.users || [] as user}
						<Table.Row>
							<Table.Cell class="font-medium">
								<div class="flex items-center gap-3">
                                    {#if user.avatarUrl}
                                        <img src={user.avatarUrl} alt={user.name} class="h-10 w-10 rounded-full object-cover shrink-0" />
                                    {:else}
                                        <div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                            <UsersIcon size={20} />
                                        </div>
                                    {/if}
									<div>
										<p class="font-medium">{user.name || 'Anonymous'}</p>
										<p class="text-xs text-muted-foreground">{user.email}</p>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="outline" class="bg-primary/10 text-primary border-primary/20 flex w-fit items-center gap-1 uppercase">
									<Shield size={12} />
									{user.role}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<div class="flex flex-col gap-1">
									<Badge variant="outline" class={user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
										{user.status || 'Active'}
									</Badge>
									{#if user.role === 'member' && user.status === 'inactive'}
										<Badge variant="outline" class="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
											Pending Role
										</Badge>
									{/if}
								</div>
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
			</div>

			<!-- Mobile Cards View -->
			<div class="grid grid-cols-1 gap-4 md:hidden p-4">
				{#each data.users || [] as user}
					<div class="flex flex-col p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
						<div class="flex items-start justify-between gap-3">
							<div class="flex items-center gap-3">
								{#if user.avatarUrl}
									<img src={user.avatarUrl} alt={user.name} class="h-10 w-10 rounded-full object-cover shrink-0" />
								{:else}
									<div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
										<UsersIcon size={20} />
									</div>
								{/if}
								<div>
									<p class="font-medium leading-none">{user.name || 'Anonymous'}</p>
									<p class="text-xs text-muted-foreground mt-1 truncate max-w-[160px]">{user.email}</p>
								</div>
							</div>
							<Button href="/users/{user.id}" variant="ghost" size="icon" class="h-8 w-8 shrink-0 text-primary">
								<Edit3 size={16} />
							</Button>
						</div>
						
						<div class="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
							<Badge variant="outline" class="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 uppercase text-[10px] py-0">
								<Shield size={10} />
								{user.role}
							</Badge>
							<Badge variant="outline" class="text-[10px] py-0 {user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}">
								{user.status || 'Active'}
							</Badge>
							<div class="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
								<Clock size={12} />
								{new Date(user.createdAt).toLocaleDateString()}
							</div>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
						<div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
							<UsersIcon size={24} />
						</div>
						<p class="font-medium">No users found</p>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>
