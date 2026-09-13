import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves this project from /OGCruncher/.
  base: '/OGCruncher/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure we have hashes in filenames for cache busting
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  },
  plugins: [
    VitePWA({
    // Registration is owned by js/main.js and update activation by js/sw-update.js.
    // Prompt-style updates avoid replacing a page that owns in-memory queue files
    // and output Blob URLs.
    registerType: 'prompt',
    injectRegister: null,
      includeAssets: ['robots.txt'],
      manifest: {
        name: 'OGCruncher',
        short_name: 'OGCruncher',
        description: 'A local browser audio bit-crusher and lo-fi converter by Ihor Sivochka.',
        theme_color: '#f2f0eb',
        background_color: '#f2f0eb',
        display: 'standalone',
        icons: [
          {
            src: 'images/logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'images/logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        // Cache all static assets from the build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,mem}'],
        // Increase the size limit for cached files (OggVorbisEncoder is ~350kb, .mem is ~550kb)
        maximumFileSizeToCacheInBytes: 5000000, 
        runtimeCaching: []
      }
    })
  ]
});
