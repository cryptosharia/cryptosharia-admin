<script lang="ts">
	import { ArrowLeft, Info, ShieldCheck } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center gap-4">
		<Button href="/users" variant="outline" size="icon" class="rounded-full">
			<ArrowLeft size={18} />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Tambah akses admin</h1>
			<p class="text-muted-foreground">Akun API v2 dibuat melalui login OTP.</p>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2"
				><ShieldCheck size={20} /> Alur pemberian akses</CardTitle
			>
			<CardDescription
				>API v2 tidak lagi membuat akun dengan password dari panel admin.</CardDescription
			>
		</CardHeader>
		<CardContent class="space-y-5">
			<ol class="list-decimal space-y-3 pl-5 text-sm leading-6">
				<li>Minta pengguna login sekali melalui halaman admin menggunakan email dan kode OTP.</li>
				<li>Akun akan muncul pada daftar pengguna dengan role <code>member</code>.</li>
				<li>Buka detail pengguna, pilih role administratif yang sesuai, lalu aktifkan akunnya.</li>
			</ol>
			<div
				class="flex gap-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"
			>
				<Info class="mt-0.5 shrink-0" size={18} />
				<span
					>Jangan memberikan role <strong>super_admin</strong> kecuali benar-benar diperlukan.</span
				>
			</div>
			<Button href="/users" class="w-full">Kembali ke daftar pengguna</Button>
		</CardContent>
	</Card>
</div>
