'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();
const FALLBACK_PRODUCT_IMAGE = '/logo.png';

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) || null : null;
  } catch {
    return null;
  }
}

function getStoredUserId() {
  return getStoredUser()?.id || null;
}

function hasCartAccess(user) {
  if (!user?.id) return false;

  const rawRoles = Array.isArray(user?.roles)
    ? user.roles
    : String(user?.roles || user?.role || '')
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean);

  if (!rawRoles.length) return true;
  return rawRoles.some((role) => ['user', 'admin'].includes(String(role).toLowerCase()));
}

function getCartStorageKey(userId) {
  return userId ? `cart_user_${userId}` : null;
}

function normalizeImageUrl(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value) return FALLBACK_PRODUCT_IMAGE;
  if (value.startsWith('data:image/')) return FALLBACK_PRODUCT_IMAGE;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  return `/${value}`;
}

function normalizeCartItem(item) {
  return {
    ...item,
    image_url: normalizeImageUrl(item?.image_url),
  };
}

function needsImageRefresh(item) {
  const imageUrl = normalizeImageUrl(item?.image_url);
  return !imageUrl || imageUrl === FALLBACK_PRODUCT_IMAGE;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [lastAdded, setLastAdded] = useState(null);
  const [userId, setUserId] = useState(null);
  const [canUseCart, setCanUseCart] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = getStoredUser();
      setUserId(storedUser?.id || null);
      setCanUseCart(hasCartAccess(storedUser));
    };
    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('user-changed', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-changed', syncUser);
    };
  }, []);

  useEffect(() => {
    if (!canUseCart || !userId) {
      setCart([]);
      return;
    }

    try {
      const raw = localStorage.getItem(getCartStorageKey(userId));
      if (raw) setCart(JSON.parse(raw).map(normalizeCartItem));
      else setCart([]);
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
    }
  }, [userId, canUseCart]);

  useEffect(() => {
    const itemsToRefresh = cart.filter((item) => item?.id && needsImageRefresh(item));
    if (!itemsToRefresh.length) return;

    let cancelled = false;

    (async () => {
      try {
        const responses = await Promise.all(
          itemsToRefresh.map((item) =>
            fetch(`/api/products/${item.id}`)
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null)
          )
        );

        if (cancelled) return;

        const imageByProductId = new Map();
        responses.forEach((body) => {
          if (body?.product?.id) {
            imageByProductId.set(body.product.id, normalizeImageUrl(body.product.image_url));
          }
        });

        setCart((prev) => {
          let changed = false;
          const next = prev.map((item) => {
            const refreshedImage = imageByProductId.get(item.id);
            if (refreshedImage && refreshedImage !== normalizeImageUrl(item.image_url)) {
              changed = true;
              return { ...item, image_url: refreshedImage };
            }
            return item;
          });

          return changed ? next : prev;
        });
      } catch (e) {
        console.error('Failed to refresh cart images', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cart]);

  useEffect(() => {
    if (!canUseCart || !userId) return;

    // ensure each item has a unique cartItemId so variants (size) are distinct
    const normalized = cart.map(i => ({
      ...normalizeCartItem(i),
      cartItemId: i.cartItemId || (i.id + '-' + (i.size || 'NOSIZE'))
    }));
    try {
      localStorage.setItem(getCartStorageKey(userId), JSON.stringify(normalized));
    } catch (e) {
      console.error('Failed to persist cart to localStorage', e);
      const compactCart = normalized.map(({ image_url, ...item }) => ({ ...item, image_url: FALLBACK_PRODUCT_IMAGE }));
      localStorage.setItem(getCartStorageKey(userId), JSON.stringify(compactCart));
      if (JSON.stringify(compactCart) !== JSON.stringify(normalized)) {
        setCart(compactCart);
        return;
      }
    }
    if (JSON.stringify(normalized) !== JSON.stringify(cart)) {
      setCart(normalized);
    }
  }, [cart, userId, canUseCart]);

  function addItem(item, quantity = 1) {
    if (!canUseCart || !userId) {
      return false;
    }

    setCart(prev => {
      const key = item.cartItemId || (item.id + '-' + (item.size || 'NOSIZE'));
      const idx = prev.findIndex(i => i.cartItemId === key || (i.id === item.id && (i.size || 'NOSIZE') === (item.size || 'NOSIZE')));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 0) + quantity };
        const last = normalizeCartItem(copy[idx]);
        setLastAdded(last);
        window.dispatchEvent(new Event('cart-changed'));
        return copy;
      }
      const newItem = { ...normalizeCartItem(item), quantity, cartItemId: key };
      setLastAdded(newItem);
      window.dispatchEvent(new Event('cart-changed'));
      window.dispatchEvent(new Event('recommendations-updated'));
      return [...prev, newItem];
    });

    return true;
  }

  // Note: Do not auto-clear lastAdded here; let the toast component
  // manage visibility and clearing so we can play exit animations.

  function updateItem(cartItemId, quantity) {
    if (!canUseCart || !userId) return;
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i));
  }

  function removeItem(cartItemId) {
    if (!canUseCart || !userId) return;
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  }

  function clearCart() {
    setCart([]);
    window.dispatchEvent(new Event('cart-changed'));
    window.dispatchEvent(new Event('recommendations-updated'));
  }

  function getCount() {
    return cart.reduce((s, i) => s + (i.quantity || 0), 0);
  }

  function getTotal() {
    return cart.reduce((s, i) => s + (parseFloat(i.price || 0) * (i.quantity || 0)), 0);
  }

  return (
    <CartContext.Provider value={{ cart, addItem, updateItem, removeItem, clearCart, getCount, getTotal, lastAdded, setLastAdded, canUseCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
