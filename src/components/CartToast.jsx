'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import Link from 'next/link';
import './CartToast.css';

export default function CartToast() {
  const { lastAdded, setLastAdded } = useCart();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef();
  const removeTimer = useRef();

  useEffect(() => {
    // when a new item appears, show the toast
    if (lastAdded) {
      // clear any existing timers
      clearTimeout(hideTimer.current);
      clearTimeout(removeTimer.current);
      setVisible(true);

      // auto-hide after 3s
      hideTimer.current = setTimeout(() => setVisible(false), 3000);
      // after transition (360ms) remove the item from context
      removeTimer.current = setTimeout(() => setLastAdded(null), 3400);
    }

    return () => {
      clearTimeout(hideTimer.current);
      clearTimeout(removeTimer.current);
    };
  }, [lastAdded, setLastAdded]);

  // if nothing to show, render nothing
  if (!lastAdded && !visible) return null;

  const handleClose = () => {
    setVisible(false);
    clearTimeout(removeTimer.current);
    // wait for animation to finish then clear
    removeTimer.current = setTimeout(() => setLastAdded(null), 360);
  };

  return (
    <div className={`cart-toast ${visible ? 'enter' : 'leave'}`} role="status" aria-live="polite">
      <button className="cart-toast-close" onClick={handleClose} aria-label="Close">✕</button>

      <div className="cart-toast-top">
        <span className="cart-toast-check">✓</span>
        <strong>Added to Bag</strong>
      </div>

      <div className="cart-toast-body">
        <img src={lastAdded?.image_url || '/default-product.jpg'} alt={lastAdded?.name || ''} />
        <div className="cart-toast-info">
          <div className="cart-toast-name">{lastAdded?.name}</div>
          <div className="cart-toast-meta">{lastAdded?.categories ? lastAdded.categories.join(', ') : 'Basketball Shoes'}</div>
          <div className="cart-toast-price">${Number(lastAdded?.price || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="cart-toast-actions">
        <Link href="/cart" className="cart-toast-btn outline">View Bag</Link>
        <Link href="/cart" className="cart-toast-btn primary">Checkout</Link>
      </div>
    </div>
  );
}
