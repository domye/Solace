import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      visualizer({ open: false, gzipSize: true }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          dead_code: true,
          conditionals: true,
          unused: true,
          sequences: true,
          booleans: true,
          inline: 2,
          side_effects: true,
          evaluate: true,
          reduce_vars: true,
          reduce_funcs: true,
        },
        format: {
          comments: false,
        },
      },
      cssMinify: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query', 'zustand'],
            'vendor-markdown': ['react-markdown', 'remark-gfm', 'remark-directive', 'remark-breaks', 'unist-util-visit'],
            'vendor-highlight': ['react-syntax-highlighter'],
            'vendor-image': ['react-lazy-load-image-component', 'react-photo-album', 'yet-another-react-lightbox'],
            'vendor-echarts': ['echarts'],
          },
        },
      },
      modulePreload: {
        polyfill: true,
        resolveDependencies: (url, deps) => {
          const firstScreenChunks = ['vendor-react', 'vendor-query'];
          return deps.filter(dep => 
            firstScreenChunks.some(chunk => dep.includes(chunk))
          );
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})
