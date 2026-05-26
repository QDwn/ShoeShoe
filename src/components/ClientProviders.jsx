'use client';

import React from 'react';
import { CartProvider } from '../context/CartContext';
import CartToast from './CartToast';

export default function ClientProviders({ children }) {
  return (
    <CartProvider>
      {children}
      <CartToast />
    </CartProvider>
  );
}
