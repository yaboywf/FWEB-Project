import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import eslint from "vite-plugin-eslint";

export default defineConfig(({ mode }) => {
	const isProd = mode === 'production';

	return {
		plugins: [
			react(),
			visualizer({
				open: true,
				filename: 'dist/stats.html',
				gzipSize: true,
				brotliSize: true,
			}),
			eslint({
				cache: false,
				include: ["src/**/*.js", "src/**/*.jsx"],
				exclude: ["node_modules"],
			}),
		],
		resolve: {
			alias: isProd
				? {
					react: 'preact/compat',
					'react-dom': 'preact/compat',
					'react-dom/test-utils': 'preact/test-utils',
					'react/jsx-runtime': 'preact/jsx-runtime'
				}
				: {}
		},
	}
})