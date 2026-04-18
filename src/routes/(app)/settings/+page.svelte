<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Save, Settings as SettingsIcon, Globe, Shield, Bell, CheckCircle2 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
	import { cn } from "$lib/utils";

	let { data, form } = $props();

	let sections = [
		{ id: 'general', label: 'General', icon: Globe },
		{ id: 'security', label: 'Security', icon: Shield },
		{ id: 'notifications', label: 'Notifications', icon: Bell }
	];

	// Use query parameter to manage active section
	let activeSection = $derived($page.url.searchParams.get('tab') || 'general');
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
		<p class="text-muted-foreground mt-2">Configure application preferences and system parameters.</p>
	</div>

	<div class="flex flex-col md:flex-row gap-8">
		<!-- Sidebar -->
		<div class="w-full md:w-64 shrink-0 space-y-1">
			{#each sections as section}
				<Button
					variant="ghost"
					href="?tab={section.id}"
					class={cn(
						"w-full justify-start gap-3 px-4 py-3 h-auto rounded-xl transition-all text-sm font-medium",
						activeSection === section.id 
							? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm" 
							: "text-muted-foreground hover:bg-muted hover:text-foreground"
					)}
				>
					<section.icon size={18} />
					{section.label}
				</Button>
			{/each}
		</div>

		<!-- Content -->
		<div class="flex-1">
			<div class="space-y-6">
				{#if activeSection === 'general'}
					<form method="POST" action="?/update" use:enhance>
						<Card>
							<CardHeader>
								<CardTitle>General Settings</CardTitle>
								<CardDescription>Global preferences for the administration panel.</CardDescription>
							</CardHeader>
							<CardContent class="space-y-6">
								<div class="space-y-4">
									<div class="space-y-2">
										<label for="site_name" class="text-sm font-medium leading-none">Site Name</label>
										<Input
											type="text"
											id="site_name"
											name="setting_site_name"
											value="CryptoSharia"
										/>
									</div>
									<div class="space-y-2">
										<label for="support_email" class="text-sm font-medium leading-none">Support Email</label>
										<Input
											type="email"
											id="support_email"
											name="setting_support_email"
											value="support@cryptosharia.com"
										/>
									</div>
								</div>
								<div class="flex justify-end pt-4 border-t">
									<Button type="submit">
										<Save size={18} class="mr-2" />
										Save Changes
									</Button>
								</div>
							</CardContent>
						</Card>
					</form>
				{:else if activeSection === 'security'}
					<div class="space-y-6">
						<!-- 2FA Section -->
						<Card>
							<CardHeader>
								<div class="flex items-center gap-4">
									<div class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
										<Shield size={20} />
									</div>
									<div class="space-y-1">
										<CardTitle>Two-Factor Authentication (2FA)</CardTitle>
										<CardDescription>Add an extra layer of security to your account.</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{#if data.twoFactorEnabled}
									<div class="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
										<div class="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
											<CheckCircle2 size={20} />
											<span class="text-sm font-bold uppercase tracking-wider">2FA is currently enabled</span>
										</div>
										<form action="?/disable2FA" method="POST" use:enhance>
											<Button type="submit" variant="ghost" class="text-destructive hover:text-destructive hover:bg-destructive/10">
												Disable 2FA
											</Button>
										</form>
									</div>
								{:else}
									<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
										<div class="space-y-4">
											<div class="space-y-2">
												<p class="text-sm font-medium">1. Scan QR Code</p>
												<p class="text-xs text-muted-foreground leading-relaxed">
													Scan this code with your authenticator app (Google Authenticator, Authy, etc.)
												</p>
											</div>
											<div class="bg-white p-2 rounded-xl border inline-block">
												<img src={data.qrCodeUrl} alt="2FA QR Code" class="w-40 h-40" />
											</div>
											<div class="p-3 bg-muted rounded-lg font-mono text-[10px] break-all border">
												Secret: {data.twoFactorSecret}
											</div>
										</div>
										<div class="space-y-4">
											<div class="space-y-2">
												<p class="text-sm font-medium">2. Verify & Enable</p>
												<p class="text-xs text-muted-foreground leading-relaxed">
													Enter the 6-digit verification code from your authenticator app.
												</p>
											</div>
											<form action="?/enable2FA" method="POST" use:enhance class="space-y-4">
												<Input
													type="text"
													name="token"
													placeholder="000000"
													maxlength={6}
													required
													class="text-center text-2xl h-14 tracking-[0.5em] font-bold"
												/>
												<input type="hidden" name="secret" value={data.twoFactorSecret} />
												<Button type="submit" class="w-full h-12">
													Verify & Enable 2FA
												</Button>
											</form>
										</div>
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Password Change -->
						<Card>
							<CardHeader>
								<CardTitle>Change Password</CardTitle>
								<CardDescription>Request a password reset link to your email.</CardDescription>
							</CardHeader>
							<CardContent>
								<form action="?/changePassword" method="POST" use:enhance class="space-y-4">
									<p class="text-sm text-muted-foreground">
										We'll send a password reset link to <strong>{data.user?.email}</strong>.
									</p>
									<div class="flex justify-end pt-4 border-t">
										<Button type="submit">
											<Save size={18} class="mr-2" />
											Send Reset Link
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>
					</div>
				{:else if activeSection === 'notifications'}
					<Card>
						<CardContent class="py-12 flex flex-col items-center justify-center text-center space-y-4">
							<div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
								<Bell size={24} />
							</div>
							<div class="space-y-1">
								<h3 class="font-bold">Notification Preferences</h3>
								<p class="text-sm text-muted-foreground">Notification settings are coming soon.</p>
							</div>
						</CardContent>
					</Card>
				{/if}

				{#if form?.success}
					<div class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in slide-in-from-top-2">
						<div class="flex items-center gap-2">
							<CheckCircle2 size={18} />
							{form.message || 'Settings updated successfully!'}
						</div>
					</div>
				{/if}

				{#if form?.message && !form?.success}
					<div class="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium animate-in fade-in slide-in-from-top-2">
						{form.message}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>



