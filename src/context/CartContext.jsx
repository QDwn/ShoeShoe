'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart');
      if (raw) setCart(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
    }
  }, []);

  useEffect(() => {
    // ensure each item has a unique cartItemId so variants (size) are distinct
    const normalized = cart.map(i => ({
      ...i,
      cartItemId: i.cartItemId || (i.id + '-' + (i.size || 'NOSIZE'))
    }));
    localStorage.setItem('cart', JSON.stringify(normalized));
    if (JSON.stringify(normalized) !== JSON.stringify(cart)) {
      setCart(normalized);
    }
  }, [cart]);

  function addItem(item, quantity = 1) {
    setCart(prev => {
      const key = item.cartItemId || (item.id + '-' + (item.size || 'NOSIZE'));
      const idx = prev.findIndex(i => i.cartItemId === key || (i.id === item.id && (i.size || 'NOSIZE') === (item.size || 'NOSIZE')));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 0) + quantity };
        const last = { ...copy[idx] };
        setLastAdded(last);
        return copy;
      }
      const newItem = { ...item, quantity, cartItemId: key };
      setLastAdded(newItem);
      return [...prev, newItem];
    });
  }

  // Note: Do not auto-clear lastAdded here; let the toast component
  // manage visibility and clearing so we can play exit animations.

  function updateItem(cartItemId, quantity) {
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i));
  }

  function removeItem(cartItemId) {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  }

  function clearCart() {
    setCart([]);
  }

  function getCount() {
    return cart.reduce((s, i) => s + (i.quantity || 0), 0);
  }

  function getTotal() {
    return cart.reduce((s, i) => s + (parseFloat(i.price || 0) * (i.quantity || 0)), 0);
  }

  return (
    <CartContext.Provider value={{ cart, addItem, updateItem, removeItem, clearCart, getCount, getTotal, lastAdded, setLastAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
