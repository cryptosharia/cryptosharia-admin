<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		ArrowLeft,
		Save,
		Trash2,
		CheckCircle2,
		User,
		Shield,
		Clock,
		Mail,
		Info,
		ImageIcon
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import ImageUpload from '$lib/components/ImageUpload.svelte';

	let { data, form } = $props();
	let loading = $state(false);

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'suspended', label: 'Suspended' },
		{ value: 'banned', label: 'Banned' }
	];
</script>

<div class="mx-auto max-w-5xl space-y-6">
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
		enctype="multipart/form-data"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				update();
			};
		}}
		class="space-y-8"
	>
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Main Info -->
			<div class="space-y-6 lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<User size={18} class="text-primary" />
							Account Details
						</CardTitle>
						<CardDescription>Primary account information for this user.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Avatar section -->
						<div class="flex flex-col gap-6 border-b pb-6 sm:flex-row">
							<!-- Current avatar display -->
							<div class="flex shrink-0 flex-col items-center gap-2">
								{#if data.user.avatar?.url}
									<img
										src={data.user.avatar.url}
										alt={data.user.name ?? 'User'}
										class="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20"
									/>
								{:else}
									<div
										class="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 text-2xl font-bold text-orange-500 ring-2 ring-orange-500/20"
									>
										{data.user.name?.[0]?.toUpperCase() ?? 'U'}
									</div>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-xl font-bold">{data.user.name || 'Anonymous'}</p>
								<p class="truncate text-sm text-muted-foreground">{data.user.email}</p>
								<div class="mt-2 flex items-center gap-2">
									<Badge variant="outline" class="capitalize">{data.user.role}</Badge>
									<Badge
										variant="outline"
										class={data.user.status === 'active'
											? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
											: 'border-destructive/20 bg-destructive/10 text-destructive'}
									>
										{data.user.status}
									</Badge>
								</div>
							</div>
						</div>

						<!-- Avatar upload -->
						<div class="space-y-2 pt-2">
							<label class="flex items-center gap-2 text-sm leading-none font-medium">
								<ImageIcon size={14} />
								Avatar Image (Optional)
							</label>
							<ImageUpload
								name="avatar"
								label="Avatar"
								currentUrl={data.user.avatar?.url ?? null}
								aspectRatio="square"
							/>
						</div>

						<div class="space-y-4 pt-2">
							<div class="space-y-2">
								<label for="name" class="flex items-center gap-2 text-sm leading-none font-medium">
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
									class="h-12 text-lg font-medium"
								/>
							</div>

							<div class="space-y-2">
								<label for="email" class="flex items-center gap-2 text-sm leading-none font-medium">
									Email Address
								</label>
								<Input
									type="email"
									id="email"
									name="email"
									value={data.user.email}
									disabled
									class="h-10 cursor-not-allowed bg-muted/30 opacity-60"
								/>
								<p class="flex items-center gap-1 text-xs text-muted-foreground italic">
									<Info size={12} /> Email cannot be changed via admin panel for security.
								</p>
							</div>
						</div>

						<Separator />

						<div class="space-y-4">
							<p class="text-sm font-bold tracking-wider text-muted-foreground uppercase">
								System Metadata
							</p>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="space-y-1 rounded-lg border bg-muted/30 p-4">
									<p class="text-[10px] font-bold text-muted-foreground uppercase">Date Joined</p>
									<p class="text-sm font-medium">
										{new Date(data.user.createdAt).toLocaleString('id-ID')}
									</p>
								</div>
								<div class="space-y-1 rounded-lg border bg-muted/30 p-4">
									<p class="text-[10px] font-bold text-muted-foreground uppercase">Last Activity</p>
									<p class="text-sm font-medium">
										{data.user.lastLoginAt
											? new Date(data.user.lastLoginAt).toLocaleString('id-ID')
											: 'Never'}
									</p>
								</div>
								<div class="space-y-1 rounded-lg border bg-muted/30 p-4">
									<p class="text-[10px] font-bold text-muted-foreground uppercase">Email Status</p>
									<p class="text-sm font-medium">
										{data.user.isEmailVerified ? '✅ Verified' : '❌ Unverified'}
									</p>
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
								<label
									for="status"
									class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
									>Account Status</label
								>
								<select
									id="status"
									name="status"
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
								>
									{#each statusOptions as opt}
										<option value={opt.value} selected={data.user.status === opt.value}
											>{opt.label}</option
										>
									{/each}
								</select>
								<p class="text-xs text-muted-foreground">Only "Active" users can sign in.</p>
							</div>

							<div class="space-y-2">
								<label
									for="role"
									class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
									>User Role</label
								>
								<select
									id="role"
									name="role"
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
								>
									{#each data.roles as opt}
										<option value={opt.value} selected={data.user.role === opt.value}
											>{opt.label}</option
										>
									{/each}
								</select>
							</div>
						</div>

						<Separator />

						<Button type="submit" disabled={loading} class="h-12 w-full gap-2 font-bold">
							{#if loading}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"
								></div>
								Saving...
							{:else}
								<Save size={18} />
								Update User
							{/if}
						</Button>

						{#if form?.message && !form?.success}
							<div
								class="animate-in fade-in slide-in-from-top-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
							>
								{form.message}
							</div>
						{/if}

						{#if form?.success}
							<div
								class="animate-in fade-in slide-in-from-top-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
							>
								<div class="flex items-center gap-2">
									<CheckCircle2 size={16} />
									Updated successfully!
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>
