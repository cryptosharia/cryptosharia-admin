<script lang="ts">
	import { TrendingUp, Users, FileText, Activity, ShieldCheck, Bell, ChevronRight, ArrowRight } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Button from '$lib/components/ui/button/button.svelte';
	import { fade, fly } from 'svelte/transition';

	let { data } = $props();

	let stats = $derived([
		{ label: 'Total Tokens', value: data.tokenCount.toLocaleString(), change: 'Tokens tracked', icon: TrendingUp, color: 'text-orange-500' },
		{ label: 'Total Users', value: data.userCount.toLocaleString(), change: 'Registered users', icon: Users, color: 'text-blue-500' },
		{ label: 'Total Posts', value: data.postCount.toLocaleString(), change: 'Content published', icon: FileText, color: 'text-emerald-500' },
		{ label: 'System Health', value: '100%', change: 'All systems operational', icon: ShieldCheck, color: 'text-purple-500' }
	]);
</script>

<div class="space-y-12">
	<!-- Hero Section -->


	<!-- Stats Bento Grid -->
	<section>
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-2xl font-bold tracking-tight">System Overview</h2>
				<p class="text-muted-foreground">Real-time metrics from the ecosystem.</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each stats as stat, i}
				<div in:fly={{ y: 20, duration: 400, delay: i * 100 }}>
					<Card class="h-full hover:border-orange-500/30 transition-colors duration-300 group">
						<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle class="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</CardTitle>
							<div class={`p-2 rounded-lg bg-secondary/50 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/20 transition-colors ${stat.color}`}>
								<stat.icon class="h-5 w-5" />
							</div>
						</CardHeader>
						<CardContent>
							<div class="text-3xl font-bold tracking-tight mb-1">{stat.value}</div>
							<p class="text-xs text-muted-foreground font-medium">
								{stat.change}
							</p>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>
	</section>

	<!-- Activity & System (Bottom Bento) -->
	<section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<Card class="lg:col-span-2 relative overflow-hidden">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Activity class="h-5 w-5 text-orange-500" />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-6">
					{#each [1, 2, 3] as i}
						<div class="flex items-center justify-between group p-2 rounded-lg hover:bg-secondary/40 transition-colors">
							<div class="flex items-center gap-4">
								<div class="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
									<FileText class="h-5 w-5" />
								</div>
								<div>
									<p class="text-sm font-medium text-foreground">Token Analysis Updated</p>
									<p class="text-xs text-muted-foreground">BTC-2024 Report finalized</p>
								</div>
							</div>
							<div class="text-sm text-muted-foreground">2m ago</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<Card class="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900 border-emerald-100 dark:border-emerald-900/30">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<ShieldCheck class="h-5 w-5 text-emerald-600" />
					System Health
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex flex-col items-center justify-center h-48 space-y-4">
					<div class="relative">
						<div class="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse"></div>
						<div class="h-24 w-24 rounded-full border-4 border-emerald-100 dark:border-emerald-900 flex items-center justify-center bg-white dark:bg-gray-900 relative z-10">
							<span class="text-2xl font-bold text-emerald-600">98%</span>
						</div>
					</div>
					<div class="text-center">
						<p class="font-medium text-foreground">Operational</p>
						<p class="text-xs text-muted-foreground">All nodes synced</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</section>
</div>
