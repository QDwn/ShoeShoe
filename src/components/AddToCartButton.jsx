'use client';

import React from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

const FALLBACK_PRODUCT_IMAGE = '/logo.png';

function getSafeProductImage(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value || value.startsWith('data:image/')) return FALLBACK_PRODUCT_IMAGE;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  return `/${value}`;
}

export default function AddToCartButton({ product, small }) {
  const { addItem } = useCart();
  const router = useRouter();

  const handle = async (e) => {
    e.preventDefault();
    try {
      // check if product has sizes defined in backend
      const res = await fetch(`/api/products/${product.id}/sizes`);
      if (res.ok) {
        const body = await res.json();
        if (body.sizes && body.sizes.length > 0) {
          // product has sizes -> force user to product detail to select size
          router.push(`/product/${product.id}`);
          return;
        }
      }

      const priceNum = parseFloat(product.price) || 0;
      addItem({ id: product.id, name: product.name, price: priceNum, image_url: getSafeProductImage(product.image_url) });
    } catch (err) {
      console.error('AddToCart error', err);
      // fallback: navigate to product page
      router.push(`/product/${product.id}`);
    }
  };

  return (
    <button onClick={handle} className={small ? 'add-to-cart small' : 'add-to-cart'}>
      Add to cart
    </button>
  );
}
