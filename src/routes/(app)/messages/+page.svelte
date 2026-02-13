<script lang="ts">
	import { enhance } from '$app/forms';
	import { Bell, Mail, Clock, Trash2 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";

	let { data } = $props();
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
		<p class="text-muted-foreground mt-2">View and manage inquiries and access requests.</p>
	</div>

	<div class="grid grid-cols-1 gap-4">
		{#each data.messages as msg}
			<Card class="hover:border-primary/20 transition-colors">
				<CardContent class="p-6">
					<div class="flex items-start justify-between gap-4">
						<div class="flex items-start gap-4">
							<div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
								<Mail size={24} />
							</div>
							<div class="space-y-3">
								<div class="space-y-1">
									<div class="flex items-center gap-3">
										<h3 class="font-bold text-lg leading-none">{msg.name}</h3>
										<span class="text-xs text-muted-foreground flex items-center gap-1">
											<Clock size={12} />
											{new Date(msg.createdAt).toLocaleString()}
										</span>
									</div>
									<p class="text-sm font-medium text-primary">{msg.email}</p>
								</div>
								<div class="bg-muted/50 border rounded-xl p-4 text-foreground text-sm leading-relaxed">
									{msg.message}
								</div>
							</div>
						</div>
						
						<form action="?/delete" method="POST" use:enhance onsubmit={(e) => !confirm('Delete this message?') && e.preventDefault()}>
							<input type="hidden" name="id" value={msg.id} />
							<Button type="submit" variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
								<Trash2 size={18} />
							</Button>
						</form>
					</div>
				</CardContent>
			</Card>
		{:else}
			<Card class="py-12 border-dashed">
				<CardContent class="text-center text-muted-foreground">
					No messages found.
				</CardContent>
			</Card>
		{/each}
	</div>
</div>

