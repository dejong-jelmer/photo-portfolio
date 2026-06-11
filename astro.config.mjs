// @ts-check
import { defineConfig, sharpImageService } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  image: {
    // AVIF effort is set slightly below sharp's default to keep build times
    // within the Cloudflare Pages 20-minute limit as the photo count grows.
    service: sharpImageService({
      avif: { effort: 3, quality: 60 },
      webp: { quality: 80 },
      jpeg: { quality: 80, mozjpeg: true },
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
