<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save, Trash2, CheckCircle2, User, Shield, Clock, Mail, Info } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import { Separator } from "$lib/components/ui/separator";

	let { data, form } = $props();
	let loading = $state(false);

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'suspended', label: 'Suspended' },
		{ value: 'banned', label: 'Banned' },
	];
</script>

<div class="space-y-6 max-w-5xl mx-auto">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/users" variant="outline" size="icon" class="rounded-full">
				<ArrowLeft size={18} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Edit User</h1>
				<p class="text-muted-foreground">{data.user.name || 'Anonymous User'}</p>
			</div>
		</div>
	</div>

	<form 
		method="POST" 
		action="?/update" 
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				update();
			};
		}} 
		class="space-y-8"
	>
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Info -->
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<User size={18} class="text-primary" />
							Account Details
						</CardTitle>
						<CardDescription>Primary account information for this user.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="flex items-center gap-6 pb-6 border-b">
							{#if data.user.avatar?.url}
								<img src={data.user.avatar.url} alt={data.user.name} class="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
							{:else}
								<div class="h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-2xl ring-2 ring-orange-500/20">
									{data.user.name?.[0]?.toUpperCase() ?? 'U'}
								</div>
							{/if}
							<div>
								<p class="text-xl font-bold">{data.user.name || 'Anonymous'}</p>
								<p class="text-sm text-muted-foreground">{data.user.email}</p>
								<div class="flex items-center gap-2 mt-2">
									<Badge variant="outline" class="capitalize">{data.user.role}</Badge>
									<Badge variant="outline" class={data.user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
										{data.user.status}
									</Badge>
								</div>
							</div>
						</div>

						<div class="space-y-4 pt-4">
							<div class="space-y-2">
								<label for="name" class="text-sm font-medium leading-none flex items-center gap-2">
									Full Name
								</label>
								<Input
									type="text"
									id="name"
									name="name"
									value={data.user.name}
									required
									minlength={2}
									maxlength={120}
									class="text-lg font-medium h-12"
								/>
							</div>

							<div class="space-y-2">
								<label for="email" class="text-sm font-medium leading-none flex items-center gap-2">
									Email Address
								</label>
								<Input
									type="email"
									id="email"
									name="email"
									value={data.user.email}
									disabled
									class="opacity-60 cursor-not-allowed h-10 bg-muted/30"
								/>
								<p class="text-xs text-muted-foreground italic flex items-center gap-1">
									<Info size={12} /> Email cannot be changed via admin panel for security.
								</p>
							</div>
						</div>
						
						<Separator />
						
						<div class="space-y-4">
							<p class="text-sm font-bold uppercase tracking-wider text-muted-foreground">System Metadata</p>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="rounded-lg border bg-muted/30 p-4 space-y-1">
									<p class="text-[10px] uppercase font-bold text-muted-foreground">Date Joined</p>
									<p class="text-sm font-medium">{new Date(data.user.createdAt).toLocaleString('id-ID')}</p>
								</div>
								<div class="rounded-lg border bg-muted/30 p-4 space-y-1">
									<p class="text-[10px] uppercase font-bold text-muted-foreground">Last Activity</p>
									<p class="text-sm font-medium">{data.user.lastLoginAt ? new Date(data.user.lastLoginAt).toLocaleString('id-ID') : 'Never'}</p>
								</div>
								<div class="rounded-lg border bg-muted/30 p-4 space-y-1">
									<p class="text-[10px] uppercase font-bold text-muted-foreground">Email Status</p>
									<p class="text-sm font-medium">{data.user.isEmailVerified ? '✅ Verified' : '❌ Unverified'}</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Sidebar Settings -->
			<div class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-primary">
							<Shield size={18} />
							Status & Access
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="space-y-4">
							<div class="space-y-2">
								<label for="status" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Status</label>
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
								<label for="role" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User Role</label>
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
						</div>

						<Separator />

						<Button type="submit" disabled={loading} class="w-full gap-2 h-12 font-bold">
							{#if loading}
								<div class="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
								Saving...
							{:else}
								<Save size={18} />
								Update User
							{/if}
						</Button>

						{#if form?.message && !form?.success}
							<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
								{form.message}
							</div>
						{/if}

						{#if form?.success}
							<div class="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
								<div class="flex items-center gap-2">
									<CheckCircle2 size={16} />
									Updated successfully!
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="text-sm font-bold text-destructive flex items-center gap-2">
							<Trash2 size={16} /> Danger Zone
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground mb-4">Deleting a user is permanent and will remove all their data from the platform.</p>
						<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Delete this user? This cannot be undone!') && e.preventDefault()}>
							<Button type="submit" variant="ghost" class="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all font-medium">
								Delete Account
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>
