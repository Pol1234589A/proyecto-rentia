import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// 1. IMPORTAMOS EL PLUGIN Y EL RENDERIZADOR 👇
import { prerender } from 'vite-plugin-prerender';
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
        // 2. CONFIGURACIÓN DEL PRERENDERIZADO 👇
        prerender({
          staticDir: path.join(__dirname, 'dist'), // Carpeta de salida (Vercel usa 'dist' por defecto en Vite)
          
          // LISTA DE PÁGINAS A GENERAR (Tus rutas en español)
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

          // CONFIGURACIÓN TÉCNICA (El "fotógrafo")
          renderer: new Renderer({
              // Esperamos 1 segundo para asegurar que React haya pintado todo antes de la foto
              renderAfterTime: 1000, 
              // Opcional: Si usas eventos específicos, se pueden configurar aquí
              headless: true
          }),

          // Ajuste fino para rutas
          postProcess(renderedRoute) {
            // Aseguramos que los enlaces funcionen bien en la versión estática
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