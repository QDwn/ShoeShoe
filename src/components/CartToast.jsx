'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import './CartToast.css';

export default function CartToast() {
  const { lastAdded, setLastAdded } = useCart();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef();
  const removeTimer = useRef();

  useEffect(() => {
    if (lastAdded) {
      clearTimeout(hideTimer.current);
      clearTimeout(removeTimer.current);
      setVisible(true);
      hideTimer.current = setTimeout(() => setVisible(false), 3000);
      removeTimer.current = setTimeout(() => setLastAdded(null), 3400);
    }

    return () => {
      clearTimeout(hideTimer.current);
      clearTimeout(removeTimer.current);
    };
  }, [lastAdded, setLastAdded]);

  if (!lastAdded && !visible) return null;

  const handleClose = () => {
    setVisible(false);
    clearTimeout(removeTimer.current);
    removeTimer.current = setTimeout(() => setLastAdded(null), 360);
  };

  return (
    <div className={`cart-toast ${visible ? 'enter' : 'leave'}`} role="status" aria-live="polite">
      <button className="cart-toast-close" onClick={handleClose} aria-label={t('nav.close')}>×</button>

      <div className="cart-toast-top">
        <span className="cart-toast-check">✓</span>
        <strong>{t('cart.addedToBag')}</strong>
      </div>

      <div className="cart-toast-body">
        <img src={lastAdded?.image_url || '/default-product.jpg'} alt={lastAdded?.name || ''} />
        <div className="cart-toast-info">
          <div className="cart-toast-name">{lastAdded?.name}</div>
          <div className="cart-toast-meta">{lastAdded?.categories ? lastAdded.categories.join(', ') : t('cart.fallbackCategory')}</div>
          <div className="cart-toast-price">${Number(lastAdded?.price || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="cart-toast-actions">
        <Link href="/cart" className="cart-toast-btn outline">{t('cart.viewBag')}</Link>
        <Link href="/cart" className="cart-toast-btn primary">{t('cart.checkout')}</Link>
      </div>
    </div>
  );
}
