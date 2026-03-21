<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save, User, Mail, Lock, Shield, Info } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { Separator } from "$lib/components/ui/separator";

	let { data, form } = $props();
</script>

<div class="space-y-6 max-w-5xl mx-auto">
	<div class="flex items-center gap-4">
		<Button href="/users" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Add New User</h1>
			<p class="text-muted-foreground">Register a new administrator or platform member.</p>
		</div>
	</div>

	<form method="POST" use:enhance class="space-y-8">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Info -->
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<User size={18} class="text-primary" />
							Account Credentials
						</CardTitle>
						<CardDescription>Enter the primary details for the new account.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="space-y-4">
							<div class="space-y-2">
								<label for="name" class="text-sm font-medium leading-none">Full Name</label>
								<Input
									type="text"
									id="name"
									name="name"
									required
									minlength={2}
									maxlength={120}
									placeholder="e.g. John Doe"
									class="text-lg font-medium h-12"
								/>
							</div>

							<div class="space-y-2">
								<label for="email" class="text-sm font-medium leading-none">Email Address</label>
								<Input
									type="email"
									id="email"
									name="email"
									required
									maxlength={255}
									placeholder="user@example.com"
									class="h-10"
								/>
							</div>

							<div class="space-y-2">
								<label for="password" class="text-sm font-medium leading-none">Initial Password</label>
								<Input
									type="password"
									id="password"
									name="password"
									required
									minlength={12}
									placeholder="••••••••••••"
									class="h-10 font-mono"
								/>
								<p class="text-[10px] text-muted-foreground italic flex items-center gap-1">
									<Info size={10} /> Password must be at least 12 characters.
								</p>
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
							Permissions
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="space-y-4">
							<div class="space-y-2">
								<label for="role" class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User Role</label>
								<select
									id="role"
									name="role"
									required
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									<option value="member">Member</option>
									<option value="admin">Admin</option>
									<option value="super_admin">Super Admin</option>
									<option value="posts_manager">Posts Manager</option>
									<option value="tokens_manager">Tokens Manager</option>
								</select>
							</div>

							<div class="flex items-center space-x-2 pt-2">
								<input
									type="checkbox"
									id="status"
									name="status"
									checked
									class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
								/>
								<label for="status" class="text-sm font-medium leading-none">Activate account immediately</label>
							</div>
						</div>

						<Separator />

						<Button type="submit" class="w-full gap-2 h-12 font-bold">
							<Save size={18} />
							Create Account
						</Button>

						{#if form?.message}
							<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
								{form.message}
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	</form>
</div>

