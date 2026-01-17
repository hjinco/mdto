import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
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
			"^/(1|7|E|1E)/[^/]+$": {
				target: "http://localhost:8787",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "public",
		emptyOutDir: false,
		rollupOptions: {
			input: "index.html",
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
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
