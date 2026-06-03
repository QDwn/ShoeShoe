'use client';

import React, { useState } from 'react';
import { useCart } from '../../src/context/CartContext';
import Navbar from '../../src/components/Navbar';
import { useLanguage } from '../../src/context/LanguageContext';
import './cart.css';

export default function CartPage() {
  const { cart, updateItem, removeItem, clearCart, getTotal } = useCart();
  const { t } = useLanguage();
  const [shipping, setShipping] = useState({ name: '', email: '', address: '' });
  const [status, setStatus] = useState(null);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const handleQty = (id, qty) => {
    const q = Math.max(1, parseInt(qty) || 1);
    updateItem(id, q);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    // client-side availability check before sending order
    try {
      for (const it of cart) {
        // if item has size, check product_sizes
        if (it.size) {
          const res = await fetch(`/api/products/${it.id}/sizes`);
          if (!res.ok) throw new Error('Failed to validate sizes for product ' + it.id);
          const body = await res.json();
          const found = (body.sizes || []).find(s => s.size === it.size);
          if (found) {
            if ((found.stock || 0) < (it.quantity || 0)) {
              setStatus(`${t('cart.stockIssue')} ${it.name} ${t('cart.sizeLabel')} ${it.size}`);
              return;
            }
          } else {
            // no size record -> fallback to product stock
            const pres = await fetch(`/api/products/${it.id}`);
            if (!pres.ok) throw new Error('Failed to fetch product ' + it.id);
            const pdata = await pres.json();
            if ((pdata.product.stock_quantity || 0) < (it.quantity || 0)) {
              setStatus(`${t('cart.stockIssue')} ${it.name}`);
              return;
            }
          }
        } else {
          // no size specified, check product stock
          const pres = await fetch(`/api/products/${it.id}`);
          if (!pres.ok) throw new Error('Failed to fetch product ' + it.id);
          const pdata = await pres.json();
          if ((pdata.product.stock_quantity || 0) < (it.quantity || 0)) {
            setStatus(`${t('cart.stockIssue')} ${it.name}`);
            return;
          }
        }
      }

      // all checks passed, submit order
      const payload = { shipping, items: cart, total: getTotal() };
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setStatus('success');
        clearCart();
      } else {
        const body = await res.json();
        setStatus('error: ' + (body.message || res.statusText));
      }
    } catch (err) {
      setStatus('error: ' + err.message);
    }
  };

  return (
    <div className="cart-page site-container">
      <Navbar />
      <header className="cart-header">
        <div>
          <h1 className="cart-title">{t('cart.title')} <span className="cart-count">({cart.reduce((s,i)=>s+(i.quantity||0),0)} {t('cart.items')})</span></h1>
          <p className="cart-note">{t('cart.note')}</p>
        </div>
      </header>

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
                  <div className="cart-item-meta">{item.color ? `${t('cart.color')}: ${item.color}` : ''} {item.size ? `/ ${t('cart.size')}: ${item.size}` : ''}</div>

                  <div className="cart-row-actions">
                    <select className="qty-select" value={item.quantity} onChange={(e)=>handleQty(item.cartItemId, e.target.value)}>
                      {Array.from({length:10}).map((_,i)=> <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>
                    <button className="remove-btn" onClick={()=>removeItem(item.cartItemId)} aria-label={t('cart.remove')}>🗑️</button>
                    <button className="wish-btn" aria-label={t('cart.saveForLater')}>♡</button>
                  </div>
                </div>

                  <div className="cart-row-price">{Number(item.price || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>{t('cart.orderSummary')}</h2>
            <div className="summary-line"><span>{cart.reduce((s,i)=>s+(i.quantity||0),0)} {t('cart.items')}</span><span>{getTotal().toFixed(2)}</span></div>
            <div className="summary-line"><span>{t('cart.delivery')}</span><span>{t('cart.free')}</span></div>

            {appliedPromo && appliedPromo.type !== 'none' && (
              <div className="summary-line"><span>{t('cart.promo')} ({appliedPromo.code})</span><span>-{appliedPromo.type === 'percent' ? appliedPromo.value + '%' : ''}</span></div>
            )}

            <div className="summary-total">
              <div>{t('cart.total')}</div>
              <div className="summary-amount">{( (function(){
                const base = getTotal();
                if (!appliedPromo || appliedPromo.type === 'none') return base;
                if (appliedPromo.type === 'percent') return (base * (1 - appliedPromo.value/100));
                return base;
              })()).toFixed(2)}</div>
            </div>

            <div className="promo">
              <button type="button" className="promo-toggle" onClick={() => setShowPromo(!showPromo)}>{t('cart.usePromo')}</button>
              {showPromo && (
                <div className="promo-input-wrap">
                  <input
                    className="promo-input"
                    placeholder={t('cart.enterPromo')}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="promo-apply"
                    onClick={() => {
                      const code = (promoCode || '').trim().toUpperCase();
                      if (!code) return;
                      // Example simple promo: DISCOUNT10 => 10% off
                      if (code === 'DISCOUNT10') {
                        setAppliedPromo({ code, type: 'percent', value: 10 });
                      } else {
                        setAppliedPromo({ code, type: 'none', value: 0 });
                      }
                    }}
                  >{t('cart.apply')}</button>
                </div>
              )}
            </div>

            <form onSubmit={handleCheckout} className="checkout-form">
              <button type="submit" className="checkout-btn">{t('cart.checkout')}</button>
            </form>

            <div className="payments">{t('cart.acceptedPayments')}
              <div className="payments-logos">VISA • MC • MOMO</div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
