import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Sitemap from 'vite-plugin-sitemap';
import { getSitemapRoutes } from './scripts/sitemap-routes.mjs';

const SITE_HOST = 'https://cottonunique.com';

export default defineConfig(async () => {
  const dynamicRoutes = await getSitemapRoutes();

  return {
    plugins: [
      react(),
      Sitemap({
        hostname: SITE_HOST,
        dynamicRoutes,
        generateRobotsTxt: false,
        robots: [
          {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/dashboard', '/login', '/api'],
          },
        ],
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
