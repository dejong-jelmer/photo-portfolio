import type { ImageMetadata } from 'astro';

export interface SeriesMeta {
  title?: string;
  caption?: string;
  /** File name of the cover image within the series folder, e.g. "cover.jpg". */
  cover?: string;
}

export interface GalleryImage {
  image: ImageMetadata;
  alt: string;
}

export interface GalleryItem {
  type: 'single' | 'series';
  slug: string;
  title: string;
  caption?: string;
  /** The grid thumbnail. For series this is the same image as images[0]. */
  cover: ImageMetadata;
  /** All images in lightbox order (cover first). Singles have exactly one. */
  images: GalleryImage[];
}

const PHOTOS_ROOT = '../photos/';

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '../photos/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true },
);

const metaModules = import.meta.glob<{ default: SeriesMeta }>('../photos/*/meta.json', {
  eager: true,
});

function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

function stripExtension(path: string): string {
  return path.replace(/\.[^.]+$/, '');
}

/** "2025-amsterdam-mist" → "Amsterdam Mist" (a leading date prefix is dropped). */
function formatTitle(slug: string): string {
  return slug
    .replace(/^\d{4}(-\d{2}){0,2}-/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface SeriesFile {
  path: string;
  image: ImageMetadata;
}

function pickCover(files: SeriesFile[], meta: SeriesMeta | undefined): SeriesFile {
  if (meta?.cover) {
    const fromMeta = files.find((file) => fileName(file.path) === meta.cover);
    if (fromMeta) return fromMeta;
  }
  return (
    files.find((file) => fileName(file.path).toLowerCase().includes('cover')) ?? files[0]
  );
}

function buildItems(): GalleryItem[] {
  const singles = new Map<string, ImageMetadata>();
  const seriesFiles = new Map<string, SeriesFile[]>();

  for (const [modulePath, module] of Object.entries(imageModules)) {
    const relativePath = modulePath.slice(PHOTOS_ROOT.length);
    const slash = relativePath.indexOf('/');
    if (slash === -1) {
      singles.set(stripExtension(relativePath), module.default);
    } else {
      const slug = relativePath.slice(0, slash);
      const files = seriesFiles.get(slug) ?? [];
      files.push({ path: relativePath, image: module.default });
      seriesFiles.set(slug, files);
    }
  }

  const items: GalleryItem[] = [];

  for (const [slug, image] of singles) {
    const title = formatTitle(slug);
    items.push({
      type: 'single',
      slug,
      title,
      cover: image,
      images: [{ image, alt: title }],
    });
  }

  for (const [slug, files] of seriesFiles) {
    files.sort((a, b) => a.path.localeCompare(b.path, 'en', { numeric: true }));
    const meta = metaModules[`${PHOTOS_ROOT}${slug}/meta.json`]?.default;
    const cover = pickCover(files, meta);
    const ordered = [cover, ...files.filter((file) => file !== cover)];
    const title = meta?.title ?? formatTitle(slug);
    items.push({
      type: 'series',
      slug,
      title,
      caption: meta?.caption,
      cover: cover.image,
      images: ordered.map((file, index) => ({
        image: file.image,
        alt: `${title} (${index + 1}/${ordered.length})`,
      })),
    });
  }

  return items;
}

/**
 * Grid order: newest first, assuming file/folder names start with a sortable
 * prefix (e.g. "2025-..."). Change the comparator below to reorder the grid.
 */
function compareItems(a: GalleryItem, b: GalleryItem): number {
  return b.slug.localeCompare(a.slug, 'en', { numeric: true });
}

export function getGalleryItems(): GalleryItem[] {
  return buildItems().sort(compareItems);
}
