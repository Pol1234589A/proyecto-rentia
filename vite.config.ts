import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import prerender from '@prerenderer/rollup-plugin';
// 👇 CAMBIO AQUÍ: Importamos el renderer ligero
import Renderer from '@prerenderer/renderer-jsdom';

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
          // 👇 CONFIGURACIÓN SIMPLIFICADA PARA JSDOM
          renderer: new Renderer({
              renderAfterTime: 1000, // Esperamos 1 seg a que cargue React
          }),
          postProcess(renderedRoute) {
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