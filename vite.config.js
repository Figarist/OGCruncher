import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Project root is now the actual root
  base: './', 
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
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico', 
        'robots.txt', 
        'images/*.svg', 
        'images/*.png',
        '*.js',
        '*.mem',
        'demo.mp3'
      ],
      manifest: {
        name: 'OGCruncher',
        short_name: 'OGCruncher',
        description: 'Professional Audio Bit-Crusher & Compressor',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
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
        // Cache all static assets from the build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,mem}'],
        // Increase the size limit for cached files (OggVorbisEncoder is ~350kb, .mem is ~550kb)
        maximumFileSizeToCacheInBytes: 5000000, 
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
