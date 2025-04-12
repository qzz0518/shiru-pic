import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: true
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'ShiruPic',
        short_name: 'ShiruPic',
        description: '通过图片学习日语的应用',
        theme_color: '#4e7dd1',  // 主题颜色改为应用的蓝色
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',  // 使用同一张图片作为可标记图标
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
      '@components': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src/components'),
      '@pages': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src/pages'),
      '@assets': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src/assets'),
      '@services': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src/services'),
      '@hooks': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src/hooks'),
      '@utils': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src/utils'),
      '@contexts': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src/contexts')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
