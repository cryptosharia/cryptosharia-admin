<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save, Trash2, CheckCircle2, User, Shield, Clock, Mail } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";

	let { data, form } = $props();

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'suspended', label: 'Suspended' },
		{ value: 'banned', label: 'Banned' },
	];
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
	</div>

	<!-- User Info Card -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex items-center gap-4 mb-6 pb-6 border-b">
				{#if data.user.avatar?.url}
					<img src={data.user.avatar.url} alt={data.user.name} class="h-16 w-16 rounded-full object-cover" />
				{:else}
					<div class="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xl">
						{data.user.name?.[0]?.toUpperCase() ?? 'U'}
					</div>
				{/if}
				<div>
					<p class="text-lg font-semibold">{data.user.name || 'Anonymous'}</p>
					<p class="text-sm text-muted-foreground">{data.user.email}</p>
					<div class="flex items-center gap-2 mt-1">
						<Badge variant="outline" class="text-xs capitalize">{data.user.role}</Badge>
						<Badge variant="outline" class={data.user.status === 'active' ? 'text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'text-xs bg-destructive/10 text-destructive border-destructive/20'}>
							{data.user.status}
						</Badge>
					</div>
				</div>
			</div>

			<form method="POST" action="?/update" use:enhance class="space-y-5">
				<div class="space-y-2">
					<label for="name" class="text-sm font-medium leading-none flex items-center gap-2">
						<User size={14} /> Full Name
					</label>
					<Input
						type="text"
						id="name"
						name="name"
						value={data.user.name}
						required
					/>
				</div>

				<div class="space-y-2">
					<label for="email" class="text-sm font-medium leading-none flex items-center gap-2">
						<Mail size={14} /> Email Address
					</label>
					<Input
						type="email"
						id="email"
						name="email"
						value={data.user.email}
						disabled
						class="opacity-60 cursor-not-allowed"
					/>
					<p class="text-xs text-muted-foreground">Email cannot be changed via admin panel.</p>
				</div>

				<div class="space-y-2">
					<label for="status" class="text-sm font-medium leading-none flex items-center gap-2">
						<Shield size={14} /> Account Status
					</label>
					<select
						id="status"
						name="status"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						{#each statusOptions as opt}
							<option value={opt.value} selected={data.user.status === opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<label for="role" class="text-sm font-medium leading-none flex items-center gap-2">
						<Shield size={14} /> User Role
					</label>
					<select
						id="role"
						name="role"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						{#each data.roles as opt}
							<option value={opt.value} selected={data.user.role === opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium leading-none flex items-center gap-2">
						<Clock size={14} /> Account Info
					</label>
					<div class="rounded-md border border-input bg-muted/50 px-3 py-3 text-sm space-y-1 text-muted-foreground">
						<p>Joined: {new Date(data.user.createdAt).toLocaleString('id-ID')}</p>
						<p>Last Login: {data.user.lastLoginAt ? new Date(data.user.lastLoginAt).toLocaleString('id-ID') : 'Never'}</p>
						<p>Email Verified: {data.user.isEmailVerified ? '✅ Yes' : '❌ No'}</p>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-4 border-t">
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
