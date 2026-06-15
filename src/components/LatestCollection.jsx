"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

function formatProductPrice(price) {
  return `$${Number(price || 0).toFixed(2)}`;
}

export default function LatestCollection() {
  const { t } = useLanguage();
  const [collection, setCollection] = useState([]);

  useEffect(() => {
    const loadLatest = async () => {
      try {
        const res = await fetch('/api/products?limit=9&offset=0');
        const data = await res.json();
        setCollection(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        console.error('Error loading latest collection:', error);
        setCollection([]);
      }
    };

    loadLatest();
  }, []);

  return (
    <div className="collection">
      {collection.length === 0 ? <p>{t('products.loading')}</p> : null}
      <div className="collectionScroll">
        {collection.map((item) => (
          <div className="productCard" key={item.id}>
            <img src={item.image_url} alt={item.name} />
            <h3>{item.name}</h3>
            <p>{formatProductPrice(item.price)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
