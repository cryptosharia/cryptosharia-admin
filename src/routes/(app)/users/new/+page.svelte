<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, Save } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent } from "$lib/components/ui/card";

	let { data, form } = $props();
</script>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<Button href="/users" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Add New User</h1>
			<p class="text-muted-foreground">Create a new user account.</p>
		</div>
	</div>

	<Card>
		<CardContent class="pt-6">
			<form method="POST" use:enhance class="space-y-6">
				<div class="grid grid-cols-1 gap-6">
					<div class="space-y-2">
						<label for="name" class="text-sm font-medium leading-none">Full Name</label>
						<Input
							type="text"
							id="name"
							name="name"
							required
							placeholder="e.g. John Doe"
						/>
					</div>

					<div class="space-y-2">
						<label for="email" class="text-sm font-medium leading-none">Email Address</label>
						<Input
							type="email"
							id="email"
							name="email"
							required
							placeholder="user@example.com"
						/>
					</div>

					<div class="space-y-2">
						<label for="password" class="text-sm font-medium leading-none">Password</label>
						<Input
							type="password"
							id="password"
							name="password"
							required
							placeholder="••••••••"
						/>
					</div>

					<div class="space-y-2">
						<label for="role" class="text-sm font-medium leading-none">Role (Optional)</label>
						<select
							id="role"
							name="role"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="member">Member</option>
							<option value="admin">Admin</option>
							<option value="super_admin">Super Admin</option>
                            <option value="posts_manager">Posts Manager</option>
                            <option value="tokens_manager">Tokens Manager</option>
						</select>
					</div>

					<div class="flex items-center space-x-2">
						<input
							type="checkbox"
							id="status"
							name="status"
							checked
							class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
						/>
						<label for="status" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Account Active</label>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-6 border-t">
					<Button href="/users" variant="ghost">Cancel</Button>
					<Button type="submit" class="gap-2">
						<Save size={18} />
						Create User
					</Button>
				</div>

				{#if form?.message}
					<div class="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium animate-in fade-in slide-in-from-top-2">
						{form.message}
					</div>
				{/if}
			</form>
		</CardContent>
	</Card>
</div>
