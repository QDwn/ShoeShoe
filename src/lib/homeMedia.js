export const HOME_MEDIA_STORAGE_KEY = 'home_media_config';
export const HOME_MEDIA_EVENT = 'home-media-updated';

export const defaultHomeMedia = {
  heroImages: ['/img nba all star 2026.jpg', '/ja2.jpg'],
  featuredImages: ['/warmup.jpg', '/jerseys.jpg', '/socks.jpg', '/sabrina2.jpg'],
  shopByBasketballImages: [
    '/all star nba 2026.jpg',
    '/jordan.jpg',
    '/ball.jpg',
    '/bg socks.jpg',
    '/jersey allstar 2026.jpg',
    '/teeshirt allstar 2026.jpg',
  ],
};

export function getHomeMedia() {
  if (typeof window === 'undefined') {
    return defaultHomeMedia;
  }

  try {
    const raw = window.localStorage.getItem(HOME_MEDIA_STORAGE_KEY);
    if (!raw) return defaultHomeMedia;

    const parsed = JSON.parse(raw);
    return {
      heroImages: normalizeList(parsed?.heroImages, defaultHomeMedia.heroImages),
      featuredImages: normalizeList(parsed?.featuredImages, defaultHomeMedia.featuredImages),
      shopByBasketballImages: normalizeList(parsed?.shopByBasketballImages, defaultHomeMedia.shopByBasketballImages),
    };
  } catch (_error) {
    return defaultHomeMedia;
  }
}

export function saveHomeMedia(media) {
  if (typeof window === 'undefined') return;

  const normalized = {
    heroImages: normalizeList(media?.heroImages, defaultHomeMedia.heroImages),
    featuredImages: normalizeList(media?.featuredImages, defaultHomeMedia.featuredImages),
    shopByBasketballImages: normalizeList(media?.shopByBasketballImages, defaultHomeMedia.shopByBasketballImages),
  };

  window.localStorage.setItem(HOME_MEDIA_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(HOME_MEDIA_EVENT, { detail: normalized }));
}

function normalizeList(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  const cleaned = value.map((item) => String(item || '').trim());
  return cleaned.length === fallback.length ? cleaned : [...fallback];
}
