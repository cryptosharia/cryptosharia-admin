<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, Send, ArrowLeft, CheckCircle2 } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="mb-6">
	<Button variant="ghost" href="/login" class="text-sm gap-2 text-muted-foreground hover:text-foreground">
		<ArrowLeft size={16} />
		Back to Login
	</Button>
</div>

{#if form?.success}
	<div class="text-center py-8 space-y-4 animate-in fade-in zoom-in-95 duration-300">
		<div class="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
			<CheckCircle2 size={40} />
		</div>
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Request Sent!</h2>
			<p class="text-muted-foreground max-w-xs mx-auto">
				Your request has been sent to the administrators. We will contact you shortly via email.
			</p>
		</div>
		<Button href="/login" variant="outline" class="mt-4">
			Return to Login
		</Button>
	</div>
{:else}
	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				update();
			};
		}}
		class="space-y-6"
	>
		<div class="space-y-2">
			<label for="name" class="text-sm font-medium leading-none">Full Name</label>
			<Input
				type="text"
				id="name"
				name="name"
				required
				placeholder="John Doe"
				class="h-12"
			/>
		</div>

		<div class="space-y-2">
			<label for="email" class="text-sm font-medium leading-none">Email Address</label>
			<Input
				type="email"
				id="email"
				name="email"
				required
				placeholder="john@example.com"
				class="h-12"
			/>
		</div>

		<div class="space-y-2">
			<label for="message" class="text-sm font-medium leading-none">Reason for Access</label>
			<Textarea
				id="message"
				name="message"
				required
				rows={4}
				placeholder="I need access because..."
				class="resize-none"
			/>
		</div>

		{#if form?.missing}
			<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
				Please fill in all fields
			</div>
		{/if}
		
		{#if form?.error}
			<div class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
				{form.error}
			</div>
		{/if}

		<Button
			type="submit"
			disabled={loading}
			class="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20"
		>
			{#if loading}
				<Loader2 class="animate-spin" size={20} />
				Sending...
			{:else}
				Send Request
				<Send size={18} />
			{/if}
		</Button>
	</form>
{/if}

