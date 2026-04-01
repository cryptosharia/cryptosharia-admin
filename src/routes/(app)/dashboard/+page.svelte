<script lang="ts">
	import { TrendingUp, Users, FileText, Activity, ShieldCheck } from 'lucide-svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { fly } from 'svelte/transition';

	let { data } = $props();

	let stats = $derived([
		{ label: 'Total Tokens', value: data.tokenCount.toLocaleString(), change: 'Tokens tracked', icon: TrendingUp, accent: 'orange' },
		{ label: 'Total Users', value: data.userCount.toLocaleString(), change: 'Registered users', icon: Users, accent: 'blue' },
		{ label: 'Total Posts', value: data.postCount.toLocaleString(), change: 'Content published', icon: FileText, accent: 'emerald' },
		{ label: 'Messages', value: data.messageCount.toLocaleString(), change: 'Contact submissions', icon: Activity, accent: 'yellow' },
		{ label: 'Tags', value: data.tagCount.toLocaleString(), change: 'Taxonomy tags', icon: ShieldCheck, accent: 'purple' }
	]);
</script>

<div class="space-y-8">
	<!-- Stats Grid -->
	<section>
		<div class="mb-6">
			<h2 class="text-2xl font-bold tracking-tight">System Overview</h2>
			<p class="text-muted-foreground mt-1">Real-time metrics from the ecosystem.</p>
		</div>

		<div class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
			{#each stats as stat, i}
				<div in:fly={{ y: 20, duration: 400, delay: i * 80 }}>
					<Card class="h-full hover:border-orange-500/40 transition-all duration-300 group cursor-default">
						<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle class="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
								{stat.label}
							</CardTitle>
							<div class="p-2 rounded-lg bg-muted/60 group-hover:scale-110 transition-transform duration-200">
								<stat.icon class="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
							</div>
						</CardHeader>
						<CardContent>
							<div class="text-3xl font-bold tracking-tight mb-1">{stat.value}</div>
							<p class="text-xs text-muted-foreground font-medium">{stat.change}</p>
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>
	</section>

	<!-- Bottom Row -->
	<section class="grid grid-cols-1 lg:grid-cols-3 gap-5">
		<!-- Recent Activity -->
		<Card class="lg:col-span-2">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Activity class="h-5 w-5 text-orange-500" />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-1">
					{#each [1, 2, 3] as i}
						<div class="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
							<div class="flex items-center gap-3">
								<div class="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0 group-hover:scale-105 transition-transform">
									<FileText class="h-4 w-4" />
								</div>
								<div>
									<p class="text-sm font-medium">Token Analysis Updated</p>
									<p class="text-xs text-muted-foreground">BTC-2024 Report finalized</p>
								</div>
							</div>
							<span class="text-xs text-muted-foreground whitespace-nowrap">{i * 2}m ago</span>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- System Health -->
		<Card class="border-emerald-500/20">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<ShieldCheck class="h-5 w-5 text-emerald-500" />
					System Health
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex flex-col items-center justify-center h-44 space-y-4">
					<div class="relative">
						<div class="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
						<div class="relative z-10 h-24 w-24 rounded-full border-4 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
							<span class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">98%</span>
						</div>
					</div>
					<div class="text-center">
						<p class="font-semibold text-foreground">Operational</p>
						<p class="text-xs text-muted-foreground mt-0.5">All nodes synced</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</section>
</div>
