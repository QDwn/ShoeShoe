'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import { useCart } from '../../src/context/CartContext';
import { useLanguage } from '../../src/context/LanguageContext';
import './cart.css';

function resolveCartImage(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value) return '/logo.png';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  return `/${value}`;
}

export default function CartPage() {
  const router = useRouter();
  const { cart, updateItem, removeItem, getTotal, canUseCart } = useCart();
  const { t } = useLanguage();
  const [status] = useState(null);
  const [processingPayment] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoStatus, setPromoStatus] = useState('');
  const [orderNotice, setOrderNotice] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('last_order_notice');
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!parsed?.message) return;

      setOrderNotice(parsed);
      localStorage.removeItem('last_order_notice');
    } catch {
      localStorage.removeItem('last_order_notice');
    }
  }, []);

  const handleQty = (id, qty) => {
    const q = Math.max(1, parseInt(qty, 10) || 1);
    updateItem(id, q);
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setAppliedPromo(null);
      setPromoStatus(t('cart.promoRequired'));
      return;
    }

    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        setAppliedPromo(null);
        setPromoStatus(data.message || t('cart.promoInvalid'));
        return;
      }

      setAppliedPromo({
        code: data.coupon.code,
        discount: data.coupon.discount_percent,
      });
      setPromoStatus(`${t('cart.promoApplied')} ${data.coupon.code}, -${data.coupon.discount_percent}%.`);
    } catch (error) {
      setAppliedPromo(null);
      setPromoStatus(error.message || t('cart.promoInvalid'));
    }
  };

  const removePromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setPromoStatus(t('cart.promoRemoved'));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const subtotal = getTotal();
    const total = appliedPromo ? subtotal * (1 - appliedPromo.discount / 100) : subtotal;
    localStorage.removeItem('buy_now_item');
    localStorage.setItem('checkout_state', JSON.stringify({
      items: cart,
      promo: appliedPromo,
      subtotal,
      total,
    }));
    router.push('/checkout');
  };

  return (
    <div className="cart-page site-container">
      <Navbar />
      {!canUseCart ? (
        <div className="cart-header">
          <div>
            <h1 className="cart-title">{t('cart.guestTitle')}</h1>
            <p className="cart-note">{t('cart.guestNote')}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Link href="/register" className="checkout-btn" style={{ width: 'fit-content', textDecoration: 'none' }}>
                {t('cart.guestRegister')}
              </Link>
              <Link href="/login" className="promo-apply" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {t('cart.guestLogin')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {!canUseCart ? null : (
        <>
          {orderNotice && (
            <div
              className="checkout-status success"
              style={{
                marginBottom: '18px',
                position: 'sticky',
                top: '12px',
                zIndex: 10,
                boxShadow: '0 12px 28px rgba(22, 101, 52, 0.12)',
              }}
            >
              {orderNotice.message}
            </div>
          )}

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
                {cart.map((item) => (
                  <div key={item.cartItemId || item.id} className="cart-row">
                    <div className="cart-row-media">
                      <img src={resolveCartImage(item.image_url)} alt={item.name} />
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
                        <button className="remove-btn" onClick={() => removeItem(item.cartItemId)} aria-label={t('cart.remove')}>{t('cart.removeAction')}</button>
                        <button className="wish-btn" aria-label={t('cart.saveForLater')}>♡</button>
                      </div>
                    </div>

                    <div className="cart-row-price">${Number(item.price || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <aside className="cart-summary">
                <h2>{t('cart.orderSummary')}</h2>
                <div className="summary-line">
                  <span>{cart.reduce((s, i) => s + (i.quantity || 0), 0)} {t('cart.items')}</span>
                  <span>${getTotal().toFixed(2)}</span>
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
                      if (!appliedPromo) return `$${base.toFixed(2)}`;
                      return `$${(base * (1 - appliedPromo.discount / 100)).toFixed(2)}`;
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
                    {t('cart.availableCodes')}: <strong>SAVE25</strong>, <strong>SAVE30</strong>, <strong>SAVE50</strong>
                  </div>
                  {appliedPromo && (
                    <div className="promo-applied">
                      <span>{appliedPromo.code} (-{appliedPromo.discount}%)</span>
                      <button type="button" onClick={removePromo}>{t('checkout.remove')}</button>
                    </div>
                  )}
                  {promoStatus && <div className="promo-status" style={{ color: '#c62828' }}>{promoStatus}</div>}
                </div>

                <form onSubmit={handleCheckout} className="checkout-form">
                  <button type="submit" className="checkout-btn" disabled={processingPayment || cart.length === 0}>
                    {processingPayment ? t('cart.processingPayment') : t('cart.checkout')}
                  </button>
                </form>

                <div className="payments">
                  {t('cart.acceptedPayments')}
                  <div className="payments-logos">VISA • MC • MOMO</div>
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
