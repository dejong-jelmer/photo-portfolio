import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import { LIGHTBOX_URL_HASH } from '../config';

// PhotoSwipe's Content type does not know about the <picture> element we
// attach for AVIF-with-WebP-fallback rendering.
type PictureContent = {
  pictureElement?: HTMLPictureElement;
};

const HASH_PREFIX = '#g:';

export function initLightbox(): void {
  const lightbox = new PhotoSwipeLightbox({
    gallery: '[data-gallery]',
    children: 'a[data-pswp-width]',
    pswpModule: () => import('photoswipe'),
  });

  lightbox.addFilter('domItemData', (itemData, element) => {
    if (element instanceof HTMLElement && element.dataset.alt) {
      itemData.alt = element.dataset.alt;
    }
    return itemData;
  });

  // Render slides as <picture> with an AVIF source and the WebP href as
  // fallback. Pattern from https://photoswipe.com/custom-content/
  lightbox.on('contentLoad', (e) => {
    const content = e.content as typeof e.content & PictureContent;
    const avifSrc = content.data.element?.dataset.pswpAvifSrc;
    if (!avifSrc || !content.data.src) return;

    e.preventDefault();

    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.srcset = avifSrc;
    source.type = 'image/avif';

    const img = document.createElement('img');
    img.src = content.data.src;
    img.alt = content.data.alt ?? '';
    img.className = 'pswp__img';

    picture.append(source, img);
    content.pictureElement = picture;
    content.element = img;

    content.state = 'loading';
    if (img.complete) {
      content.onLoaded();
    } else {
      img.onload = () => content.onLoaded();
      img.onerror = () => content.onError();
    }
  });

  lightbox.on('contentAppend', (e) => {
    const content = e.content as typeof e.content & PictureContent;
    if (content.pictureElement && !content.pictureElement.parentNode) {
      e.preventDefault();
      content.slide?.container.append(content.pictureElement);
    }
  });

  lightbox.on('contentRemove', (e) => {
    const content = e.content as typeof e.content & PictureContent;
    if (content.pictureElement?.parentNode) {
      e.preventDefault();
      content.pictureElement.remove();
    }
  });

  if (LIGHTBOX_URL_HASH) {
    lightbox.on('change', () => {
      const pswp = lightbox.pswp;
      const slug = pswp?.currSlide?.data.element
        ?.closest('[data-gallery]')
        ?.getAttribute('data-gallery');
      if (pswp && slug) {
        history.replaceState(null, '', `${HASH_PREFIX}${slug}:${pswp.currIndex}`);
      }
    });
    lightbox.on('close', () => {
      if (location.hash.startsWith(HASH_PREFIX)) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });
  }

  lightbox.init();

  if (LIGHTBOX_URL_HASH && location.hash.startsWith(HASH_PREFIX)) {
    const [slug, index] = location.hash.slice(HASH_PREFIX.length).split(':');
    const gallery = document.querySelector<HTMLElement>(
      `[data-gallery="${CSS.escape(slug)}"]`,
    );
    if (gallery) {
      lightbox.loadAndOpen(Number(index) || 0, { gallery });
    }
  }
}
