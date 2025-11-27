import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// 👇 USAMOS LA LIBRERÍA NUEVA COMPATIBLE
import prerender from '@prerenderer/rollup-plugin';
import Renderer from '@prerenderer/renderer-puppeteer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        prerender({
          // IMPORTANTE: Ajustamos la configuración para el plugin nuevo
          routes: [
             '/',
             '/servicios',
             '/habitaciones',
             '/oportunidades',
             '/contacto',
             '/nosotros',
             '/descuentos',
             '/blog'
          ],
          renderer: new Renderer({
              renderAfterTime: 1000,
              headless: true,
              // Argumentos críticos para que Vercel no bloquee al navegador
              args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
          }),
          postProcess(renderedRoute) {
            // Marca el HTML como prerenderizado
            renderedRoute.html = renderedRoute.html
              .replace(/id="root"/, 'id="root" data-server-rendered="true"');
            return renderedRoute;
          }
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});