'use client';

import React from 'react';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import CartToast from './CartToast';

export default function ClientProviders({ children, initialLanguage }) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <CartProvider>
        {children}
        <CartToast />
      </CartProvider>
    </LanguageProvider>
  );
}
