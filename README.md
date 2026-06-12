# Jelmer — Fotografie

A static photography portfolio: an Instagram-like grid of photos that opens a
[PhotoSwipe](https://photoswipe.com/) lightbox. Some tiles are series — clicking
them opens the whole series in the lightbox. No CMS, no backend: content is
managed by adding files to the repo and pushing; Cloudflare Pages builds and
deploys automatically.

Built with [Astro](https://astro.build/) (static output), Tailwind CSS v4 and
PhotoSwipe v5. The only client-side JavaScript on the site is the PhotoSwipe
island.

## Adding content

### Add a single photo

1. Resize the photo to **max ~2560 px on the long side, JPEG quality ~80**
   (see "Pre-resize discipline" below).
2. Drop it directly into `src/photos/`, e.g. `src/photos/2026-amsterdam-mist.jpg`.
3. Commit and push. That's it — no config edits needed.

The grid is sorted by file/folder name, **newest first**, so a `YYYY-` prefix
keeps things in order. The tile title is derived from the file name (a leading
date prefix is dropped, dashes become spaces): `2026-amsterdam-mist.jpg` →
"Amsterdam Mist". The sort order lives in `compareItems` in
[`src/lib/gallery.ts`](src/lib/gallery.ts) if you ever want to change it.

### Add a series

Create a subfolder in `src/photos/`; every image in it becomes one swipeable
series behind a single grid tile:

```
src/photos/
  2025-bordeaux-chartrons/
    cover.jpg     # shown in the grid
    01.jpg        # series order = file name order, so number them
    02.jpg
    03.jpg
    meta.json     # optional
```

Rules:

- Images sort by file name — use `01.jpg`, `02.jpg`, … for explicit order.
- The **cover** (the grid tile, and the first image in the lightbox) is picked
  in this order: the file named in `meta.json` → a file with "cover" in its
  name → the first file alphabetically.
- `meta.json` is optional. Without it the title is derived from the folder
  name. With it:

  ```json
  {
    "title": "Bordeaux — Chartrons",
    "caption": "A walk through the Chartrons quarter, spring 2025.",
    "cover": "cover.jpg"
  }
  ```

Series tiles get a small stacked-cards icon in the corner; single photos don't.

### Pre-resize discipline

Resize photos to **~2560 px long side, JPEG quality ~80 before committing**.
Don't commit 40 MB camera originals:

- The repo stays small and clones stay fast.
- The build never needs more than 2560 px — anything larger is wasted bytes
  and slower image processing on every build.
- 2560 px is exactly what the lightbox serves, so nothing is lost visually.

The build generates all variants from these sources: AVIF + WebP thumbnails
(2 widths) with a JPEG fallback for the grid, and one ~2560 px AVIF + WebP
variant per image for the lightbox.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
npm run preview  # serve the built site locally
```

The sample images in `src/photos/` are generated placeholders — replace them
with real photos.

## Deploying to Cloudflare (Workers with static assets)

The site deploys as a Cloudflare Worker that serves only static assets —
[`wrangler.jsonc`](wrangler.jsonc) pins this. **Do not remove that file:**
without it, Cloudflare's build auto-configures Astro as an SSR app, whose
runtime `/_image` endpoint cannot run on a Worker, and every photo 404s.

1. Push the repo to GitHub (or GitLab).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Workers →
   Import a repository** and select the repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - No framework adapter — the output is purely static, and
     `wrangler.jsonc` tells Wrangler to upload `dist/` as assets only.
   - The default build image works (Node 22 is available).
4. Every push to the production branch deploys automatically. A custom domain
   can be attached later under the Worker's **Domains & Routes** settings.

(Classic Cloudflare Pages also works: build command `npm run build`, output
directory `dist`.)

### Why the variant count is deliberately low

Cloudflare Pages' free tier allows **20,000 files per site** and builds time
out after **20 minutes**. Every generated image variant is a file. At roughly
8 files per photo (thumbnail variants + the two lightbox variants), there is
room for ~2,000 photos. For the same reason the AVIF encoder effort is set
slightly below sharp's default in [`astro.config.mjs`](astro.config.mjs) to
keep build times down. Don't add extra widths or formats without doing this
math first.

### Analytics (optional, later)

Cloudflare Web Analytics can be enabled from the Pages project settings
without any code changes — it injects its beacon at the edge. Not enabled now.
