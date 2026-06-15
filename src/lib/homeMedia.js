export const HOME_MEDIA_STORAGE_KEY = 'home_media_config';
export const HOME_MEDIA_EVENT = 'home-media-updated';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export const defaultHomeMedia = {
  heroImages: ['/img nba all star 2026.jpg', '/ja2.jpg'],
  featuredImages: ['/warmup.jpg', '/jerseys.jpg', '/socks.jpg', '/sabrina2.jpg'],
  featuredTitles: ['Tee Warm Up', 'Jerseys', 'Socks', 'Shoes'],
  shopByBasketballImages: [
    '/all star nba 2026.jpg',
    '/jordan.jpg',
    '/ball.jpg',
    '/bg socks.jpg',
    '/jersey allstar 2026.jpg',
    '/teeshirt allstar 2026.jpg',
  ],
  shopByBasketballTitles: ['All Star NBA 2026', 'Basketball Shoes', 'Ball Basketball', 'Socks', 'Jerseys', 'Tee Shirt'],
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
      featuredTitles: normalizeList(parsed?.featuredTitles, defaultHomeMedia.featuredTitles),
      shopByBasketballImages: normalizeList(parsed?.shopByBasketballImages, defaultHomeMedia.shopByBasketballImages),
      shopByBasketballTitles: normalizeList(parsed?.shopByBasketballTitles, defaultHomeMedia.shopByBasketballTitles),
    };
  } catch (_error) {
    return defaultHomeMedia;
  }
}

export function saveHomeMedia(media) {
  const normalized = {
    heroImages: normalizeList(media?.heroImages, defaultHomeMedia.heroImages),
    featuredImages: normalizeList(media?.featuredImages, defaultHomeMedia.featuredImages),
    featuredTitles: normalizeList(media?.featuredTitles, defaultHomeMedia.featuredTitles),
    shopByBasketballImages: normalizeList(media?.shopByBasketballImages, defaultHomeMedia.shopByBasketballImages),
    shopByBasketballTitles: normalizeList(media?.shopByBasketballTitles, defaultHomeMedia.shopByBasketballTitles),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HOME_MEDIA_STORAGE_KEY, JSON.stringify(normalized));
    } catch (_error) {
      // Ignore localStorage quota issues; server persistence is the source of truth.
    }

    window.dispatchEvent(new CustomEvent(HOME_MEDIA_EVENT, { detail: normalized }));
  }

  return normalized;
}

export async function fetchHomeMediaConfig() {
  const response = await fetch(`${API_BASE}/admin/home-media`, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to load home media');
  }

  return saveHomeMedia(data.media || defaultHomeMedia);
}

export async function persistHomeMediaConfig(media) {
  const normalized = saveHomeMedia(media);
  const response = await fetch(`${API_BASE}/admin/home-media`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save home media');
  }

  return saveHomeMedia(data.media || normalized);
}

export async function uploadHomeMediaFile(file, label) {
  const imageData = await readFileAsDataUrl(file);
  const response = await fetch(`${API_BASE}/admin/home-media/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData, label }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to upload image');
  }

  return String(data.imageUrl || '');
}

function normalizeList(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  const cleaned = value.map((item) => String(item || '').trim());
  return cleaned.length ? cleaned : [...fallback];
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
