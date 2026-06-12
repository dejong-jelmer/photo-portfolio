export const SITE_TITLE = 'Jelmer — Fotografie';
export const SITE_DESCRIPTION = 'Fotografie portfolio van Jelmer.';
export const SITE_AUTHOR = 'Jelmer';
/**
 * Contact address split as [user, domain] so the assembled form never appears
 * in built HTML or JS — it is joined client-side to keep it away from scrapers.
 */
export const CONTACT_EMAIL_PARTS = ['hallo', 'jelmerfoto.nl'];

/** Reflect the open lightbox in the URL hash so a slide can be shared/linked. */
export const LIGHTBOX_URL_HASH = false;

/** Number of grid tiles that load eagerly (roughly the first visible row). */
export const EAGER_TILES = 4;
