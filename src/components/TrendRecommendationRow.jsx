"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

function resolveImageUrl(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value) return '/logo.png';
  if (value.startsWith('data:image/')) return '/logo.png';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  return `/${value}`;
}

function formatProductPrice(price) {
  return `$${Number(price || 0).toFixed(2)}`;
}

export default function TrendRecommendationRow() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState('fallback');
  const [userId, setUserId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const syncUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        setUserId(storedUser ? JSON.parse(storedUser)?.id || null : null);
      } catch {
        setUserId(null);
      }
    };

    const refreshRecommendations = () => setRefreshKey((value) => value + 1);

    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('user-changed', syncUser);
    window.addEventListener('recommendations-updated', refreshRecommendations);
    window.addEventListener('cart-changed', refreshRecommendations);

    const poll = setInterval(syncUser, 1000);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-changed', syncUser);
      window.removeEventListener('recommendations-updated', refreshRecommendations);
      window.removeEventListener('cart-changed', refreshRecommendations);
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const url = userId
          ? `/api/recommendations/home?userId=${userId}&limit=10`
          : '/api/recommendations/home?limit=10';

        const res = await fetch(url);
        const data = await res.json();

        if (!mounted) return;
        setProducts(Array.isArray(data.products) ? data.products : []);
        setMode(data.mode || 'fallback');
      } catch {
        if (!mounted) return;
        setProducts([]);
        setMode('fallback');
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [userId, refreshKey]);

  return (
    <section className="trend-recommendation">
      <div className="trend-recommendation__label">
        <span>{mode === 'personalized' ? t('recommendations.recommendedForYou') : t('recommendations.youMightLike')}</span>
        <span>{mode === 'personalized' ? t('recommendations.basedOnProfile') : t('recommendations.basedOnInterests')}</span>
      </div>

      <div className="trend-recommendation__row">
        {products.map((product) => (
          <Link href={`/product/${product.id}`} className="trend-recommendation__card" key={product.id}>
            <div className="trend-recommendation__image">
              <img src={resolveImageUrl(product.image_url)} alt={product.name} />
            </div>
            <h3>{product.name}</h3>
            <p>{formatProductPrice(product.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
