<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
	<!-- Background Gradients -->
	<div class="absolute top-0 left-0 w-full h-96 bg-primary/10 blur-[120px] -z-10 pointer-events-none"></div>
	<div class="absolute bottom-0 right-0 w-full h-96 bg-accent/10 blur-[120px] -z-10 pointer-events-none"></div>

	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-white/10 shadow-lg shadow-black/5 mb-6 backdrop-blur-sm border border-white/20">
				<img src="/logo.png" alt="CryptoSharia" class="h-12 w-12 object-contain" />
			</div>
			<h1 class="text-2xl font-bold text-foreground">CryptoSharia Admin</h1>
			<p class="text-muted-foreground mt-2">Secure Access Portal</p>
		</div>

		<div class="bg-card text-card-foreground border border-border rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
			{@render children()}
		</div>

		<div class="text-center mt-6 text-sm text-muted-foreground">
			&copy; {new Date().getFullYear()} CryptoSharia. All rights reserved.
		</div>
	</div>
</div>
