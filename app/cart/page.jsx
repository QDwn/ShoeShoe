'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../src/context/CartContext';
import Navbar from '../../src/components/Navbar';
import { useLanguage } from '../../src/context/LanguageContext';
import './cart.css';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateItem, removeItem, clearCart, getTotal } = useCart();
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoStatus, setPromoStatus] = useState('');

  const handleQty = (id, qty) => {
    const q = Math.max(1, parseInt(qty) || 1);
    updateItem(id, q);
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setAppliedPromo(null);
      setPromoStatus('Enter a promo code.');
      return;
    }

    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        setAppliedPromo(null);
        setPromoStatus(data.message || 'Invalid promo code.');
        return;
      }

      setAppliedPromo({
        code: data.coupon.code,
        discount: data.coupon.discount_percent
      });
      setPromoStatus(`Applied ${data.coupon.code} for ${data.coupon.discount_percent}% off.`);
    } catch (error) {
      setAppliedPromo(null);
      setPromoStatus(error.message || 'Invalid promo code.');
    }
  };

  const removePromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setPromoStatus('Promo removed.');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const subtotal = getTotal();
    const total = appliedPromo ? subtotal * (1 - appliedPromo.discount / 100) : subtotal;
    localStorage.setItem('checkout_state', JSON.stringify({
      items: cart,
      promo: appliedPromo,
      subtotal,
      total
    }));
    router.push('/checkout');
  };

  return (
    <div className="cart-page site-container">
      <Navbar />
      <header className="cart-header">
        <div>
          <h1 className="cart-title">
            {t('cart.title')}{' '}
            <span className="cart-count">
              ({cart.reduce((s, i) => s + (i.quantity || 0), 0)} {t('cart.items')})
            </span>
          </h1>
          <p className="cart-note">{t('cart.note')}</p>
        </div>
      </header>

      {status && (
        <div className={`checkout-status ${String(status).startsWith('error:') ? 'error' : 'success'}`}>
          {status}
        </div>
      )}

      {cart.length === 0 ? (
        <p className="empty">{t('cart.empty')}</p>
      ) : (
        <div className="cart-grid">
          <div className="cart-left">
            {cart.map(item => (
              <div key={item.cartItemId || item.id} className="cart-row">
                <div className="cart-row-media">
                  <img src={item.image_url || '/default-product.jpg'} alt={item.name} />
                </div>
                <div className="cart-row-body">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-meta">
                    {item.color ? `${t('cart.color')}: ${item.color}` : ''}{' '}
                    {item.size ? `/ ${t('cart.size')}: ${item.size}` : ''}
                  </div>

                  <div className="cart-row-actions">
                    <select className="qty-select" value={item.quantity} onChange={(e) => handleQty(item.cartItemId, e.target.value)}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <button className="remove-btn" onClick={() => removeItem(item.cartItemId)} aria-label={t('cart.remove')}>🗑️</button>
                    <button className="wish-btn" aria-label={t('cart.saveForLater')}>♡</button>
                  </div>
                </div>

                <div className="cart-row-price">{Number(item.price || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>{t('cart.orderSummary')}</h2>
            <div className="summary-line">
              <span>{cart.reduce((s, i) => s + (i.quantity || 0), 0)} {t('cart.items')}</span>
              <span>{getTotal().toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>{t('cart.delivery')}</span>
              <span>{t('cart.free')}</span>
            </div>

            {appliedPromo && (
              <div className="summary-line">
                <span>{t('cart.promo')} ({appliedPromo.code})</span>
                <span>-{appliedPromo.discount}%</span>
              </div>
            )}

            <div className="summary-total">
              <div>{t('cart.total')}</div>
              <div className="summary-amount">
                {(() => {
                  const base = getTotal();
                  if (!appliedPromo) return base.toFixed(2);
                  return (base * (1 - appliedPromo.discount / 100)).toFixed(2);
                })()}
              </div>
            </div>

            <div className="promo">
              <button type="button" className="promo-toggle" onClick={() => setShowPromo(!showPromo)}>
                {t('cart.usePromo')}
              </button>
              {showPromo && (
                <div className="promo-input-wrap">
                  <input
                    className="promo-input"
                    placeholder={t('cart.enterPromo')}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button type="button" className="promo-apply" onClick={handleApplyPromo}>
                    {t('cart.apply')}
                  </button>
                </div>
              )}
              <div className="promo-hint">
                Available codes: <strong>SAVE25</strong>, <strong>SAVE30</strong>, <strong>SAVE50</strong>
              </div>
              {appliedPromo && (
                <div className="promo-applied">
                  <span>{appliedPromo.code} (-{appliedPromo.discount}%)</span>
                  <button type="button" onClick={removePromo}>Remove</button>
                </div>
              )}
              {promoStatus && <div className="promo-status">{promoStatus}</div>}
            </div>

            <form onSubmit={handleCheckout} className="checkout-form">
              <button type="submit" className="checkout-btn" disabled={processingPayment || cart.length === 0}>
                {processingPayment ? 'Processing payment...' : t('cart.checkout')}
              </button>
            </form>

            <div className="payments">
              {t('cart.acceptedPayments')}
              <div className="payments-logos">VISA • MC • MOMO</div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
