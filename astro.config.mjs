// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // 1. URL real de producción para que funcione la validación CSRF
  site: 'https://a1-ppc-dashboard.adwebcrm.com', 
  
  output: 'server',

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: node({
    mode: 'standalone'
  }),

  // 2. Le decimos a Astro que lea la IP real detrás del proxy de CapRover/Nginx
  server: {
    clientAddressResolution: 'x-forwarded-for'
  },

  // 3. CSRF: Astro's built-in checkOrigin compares Origin vs request.url.origin,
  //    but behind CapRover/Nginx the internal URL (http://srv:3000) != browser Origin.
  //    We keep this off and use our own origin check in middleware.ts instead,
  //    which compares the browser Origin against the `site` config above.
  security: {
    checkOrigin: false
  }
});
