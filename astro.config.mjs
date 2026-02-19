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

  // 3. Mantenemos la seguridad estricta encendida
  security: {
    checkOrigin: true
  }
});
