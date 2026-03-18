import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			// Le decimos a Svelte que las llamadas a /api las mande a tu backend
			'/api': 'http://localhost:10000'
		}
	}
});