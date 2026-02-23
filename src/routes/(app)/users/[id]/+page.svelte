<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save, Trash2, CheckCircle2 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent } from "$lib/components/ui/card";

	let { data, form } = $props();
</script>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/users" variant="outline" size="icon" class="rounded-full">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Edit User</h1>
				<p class="text-muted-foreground">Update user account details and permissions.</p>
			</div>
		</div>
		
		<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Are you sure you want to delete this user?') && e.preventDefault()}>
			<Button type="submit" variant="destructive" class="gap-2">
				<Trash2 size={18} />
				Delete
			</Button>
		</form>
	</div>

	<Card>
		<CardContent class="pt-6">
			<form method="POST" action="?/update" use:enhance class="space-y-6">
				<div class="grid grid-cols-1 gap-6">
					<div class="space-y-2">
						<label for="name" class="text-sm font-medium leading-none">Full Name</label>
						<Input
							type="text"
							id="name"
							name="name"
							value={data.user.name}
							required
						/>
					</div>

					<div class="space-y-2">
						<label for="email" class="text-sm font-medium leading-none">Email Address</label>
						<Input
							type="email"
							id="email"
							name="email"
							value={data.user.email}
							required
						/>
					</div>

					<div class="space-y-2">
						<label for="password" class="text-sm font-medium leading-none">Password (Leave blank to keep current)</label>
						<Input
							type="password"
							id="password"
							name="password"
							placeholder="••••••••"
						/>
					</div>

					<div class="space-y-2">
						<label for="roleId" class="text-sm font-medium leading-none">Role</label>
						<select
							id="roleId"
							name="roleId"
							value={data.user.roleId}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value={null}>No Role</option>
							{#each data.roles as role}
								<option value={role.id}>{role.role}</option>
							{/each}
						</select>
					</div>

					<div class="flex items-center space-x-2">
						<input
							type="checkbox"
							id="status"
							name="status"
							checked={data.user.status === 'active'}
							class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
						/>
						<label for="status" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Account Active</label>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-6 border-t">
					<Button href="/users" variant="ghost">Cancel</Button>
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
							{form.message || 'User updated successfully!'}
						</div>
					</div>
				{/if}
			</form>
		</CardContent>
	</Card>
</div>
