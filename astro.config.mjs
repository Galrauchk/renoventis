import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://renoventis.fr',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/mentions-legales/') &&
        !page.includes('/politique-confidentialite/') &&
        !page.includes('/contact-merci/'),
      serialize(item) {
        const url = item.url;
        if (url === 'https://renoventis.fr/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (
          url.includes('/isolation/') ||
          url.includes('/pompe-a-chaleur/') ||
          url.includes('/panneaux-solaires/') ||
          url.includes('/chaudiere-biomasse/') ||
          url.includes('/ventilation-vmc/') ||
          url.includes('/aides-renovation/') ||
          url.includes('/devis/') ||
          url.includes('/simulateurs/')
        ) {
          item.priority = url.endsWith('/simulateurs/') ? 0.9 : 0.9;
          item.changefreq = 'weekly';
        } else if (url.includes('/guides/') && !url.endsWith('/guides/')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        } else if (url.includes('/guides/')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else if (url.includes('/contact/') || url.includes('/a-propos/')) {
          item.priority = 0.3;
          item.changefreq = 'monthly';
        }
        item.lastmod = new Date().toISOString().split('T')[0];
        return item;
      },
    }),
    mdx(),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
