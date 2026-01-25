import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
	publicDir: "./public",
	plugins: [
		tailwindcss(),
		tanstackStart({
			srcDirectory: "client",
			prerender: {
				enabled: true,
			},
		}),
		react(),
	],
	resolve: {
		alias: {
			"@shared": resolve(__dirname, "./shared"),
		},
	},
	server: {
		proxy: {
			"^/api/.*": {
				target: "http://localhost:8787",
				changeOrigin: true,
			},
			"^/(1|7|E|1E|e|1e)/[a-zA-Z0-9_-]{5}$": {
				target: "http://localhost:8787",
				changeOrigin: true,
			},
			"^/[^/]+/[a-zA-Z0-9_-]{4}$": {
				target: "http://localhost:8787",
				changeOrigin: true,
			},
		},
	},
	ssr: {
		noExternal: [
			"@hugeicons/react",
			"@hugeicons/core-free-icons",
			"react-turnstile",
		],
	},
});
