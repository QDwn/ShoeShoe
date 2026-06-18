'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import { useLanguage } from '../../src/context/LanguageContext';
import './checkout.css';

function resolveCheckoutImage(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value) return '/logo.png';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  return `/${value}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    email: '',
    country: 'United States',
    address: '',
    region: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState('neutral');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [flashNotice, setFlashNotice] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setIsLoggedIn(!!storedUser);

      if (parsedUser?.email) {
        setShipping((prev) => ({
          ...prev,
          email: prev.email || parsedUser.email || '',
        }));
      }

      const buyNowRaw = localStorage.getItem('buy_now_item');
      const checkoutRaw = localStorage.getItem('checkout_state');
      const cartRaw = localStorage.getItem('checkout_cart');
      const raw = buyNowRaw || checkoutRaw || cartRaw;

      if (!raw) {
        router.replace('/cart');
        return;
      }

      const parsed = JSON.parse(raw);
      setItems(Array.isArray(parsed.items) ? parsed.items : [parsed]);

      if (parsed.promo && parsed.promo.code && parsed.promo.discount) {
        setAppliedPromo({
          code: parsed.promo.code,
          discount: parsed.promo.discount,
        });
        setPromoCode(parsed.promo.code);
      }

      if (typeof parsed.subtotal === 'number') {
        setSubtotal(parsed.subtotal);
      }
    } catch {
      router.replace('/cart');
    }
  }, [router]);

  useEffect(() => {
    const base = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    setSubtotal(base);
  }, [items]);

  const total = useMemo(() => {
    if (appliedPromo) return subtotal * (1 - appliedPromo.discount / 100);
    return subtotal;
  }, [subtotal, appliedPromo]);

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();

    if (!code) {
      setAppliedPromo(null);
      setStatus(t('checkout.promoRequired'));
      setStatusTone('error');
      return;
    }

    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        setAppliedPromo(null);
        setStatus(data.message || t('checkout.promoInvalid'));
        setStatusTone('error');
        return;
      }

      setAppliedPromo({
        code: data.coupon.code,
        discount: data.coupon.discount_percent,
      });
      setStatus(
        t('checkout.promoApplied')
          .replace('{code}', data.coupon.code)
          .replace('{discount}', data.coupon.discount_percent)
      );
      setStatusTone('success');
    } catch (error) {
      setAppliedPromo(null);
      setStatus(error.message || t('checkout.promoInvalid'));
      setStatusTone('error');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setStatus(t('checkout.promoRemoved'));
    setStatusTone('neutral');
  };

  const handleSubmit = async () => {
    if (!items.length) return;

    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.region) {
      setStatus(t('checkout.shippingRequired'));
      setStatusTone('error');
      return;
    }

    setLoading(true);
    setStatus(t('checkout.processingPayment'));
    setStatusTone('neutral');

    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = storedUser ? JSON.parse(storedUser) : null;

      const payload = {
        shipping: {
          name: shipping.name,
          email: shipping.email || null,
          address: `${shipping.address}, ${shipping.region}, ${shipping.country}`,
          phone: shipping.phone,
        },
        items,
        total,
        paymentMethod,
        userId: user?.id || null,
        couponCode: appliedPromo?.code || null,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('checkout.paymentFailed'));

      localStorage.removeItem('buy_now_item');
      localStorage.removeItem('checkout_cart');
      localStorage.removeItem('checkout_state');
      const orderPlacedMessage = t('checkout.orderPlaced').replace('{orderId}', data.orderId);
      const emailMessage = data.email_status === 'sent'
        ? ' Confirmation email has been sent.'
        : data.email_status === 'failed'
          ? ' The order was placed, but the confirmation email could not be sent.'
          : '';
      const finalMessage = `${orderPlacedMessage}${emailMessage}`;
      setStatus(finalMessage);
      setStatusTone('success');
      setFlashNotice(finalMessage);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'last_order_notice',
          JSON.stringify({
            message: finalMessage,
            tone: 'success',
            createdAt: Date.now(),
          })
        );
      }
      setTimeout(() => router.push('/cart'), 3500);
    } catch (err) {
      setStatus(err.message);
      setStatusTone('error');
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-shell">
          <p>{t('checkout.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="checkout-shell">
        {flashNotice && (
          <div
            style={{
              position: 'sticky',
              top: 12,
              zIndex: 20,
              marginBottom: 20,
              padding: '16px 18px',
              borderRadius: 16,
              background: '#ecfdf3',
              border: '1px solid #86efac',
              color: '#166534',
              fontWeight: 700,
              boxShadow: '0 12px 28px rgba(22, 101, 52, 0.12)',
            }}
          >
            {flashNotice}
          </div>
        )}

        {!isLoggedIn && (
          <div className="checkout-top-login">
            <div>{t('checkout.loginBenefits')}</div>
            <Link href="/login" className="checkout-login-btn">{t('checkout.logIn')}</Link>
          </div>
        )}

        <div className="checkout-layout">
          <div className="checkout-left">
            <section className="checkout-card">
              <h2>{t('checkout.shippingInfo')}</h2>
              <div className="checkout-grid">
                <input placeholder={t('checkout.fullName')} value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />
                <input placeholder={t('checkout.phoneNumber')} value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                <input placeholder={t('checkout.optionalEmail')} type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} />
                <input placeholder={t('checkout.country')} value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
                <input placeholder={t('checkout.streetAddress')} value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
                <input placeholder={t('checkout.region')} value={shipping.region} onChange={(e) => setShipping({ ...shipping, region: e.target.value })} />
              </div>
            </section>

            <section className="checkout-card">
              <h2>{t('checkout.paymentMethod')}</h2>
              <label className={`pay-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                {t('checkout.cod')}
              </label>
              <label className={`pay-option ${paymentMethod === 'bank' ? 'active' : ''}`}>
                <input type="radio" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                {t('checkout.bank')}
              </label>
              <label className={`pay-option ${paymentMethod === 'wallet' ? 'active' : ''}`}>
                <input type="radio" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                {t('checkout.wallet')}
              </label>
            </section>

            <section className="checkout-card">
              <input className="checkout-note" placeholder={t('checkout.orderNotes')} />
            </section>
          </div>

          <aside className="checkout-right">
            <section className="checkout-card">
              <h3>{t('checkout.cart')}</h3>
              <div className="checkout-item-list">
                {items.map((item) => (
                  <div className="mini-item" key={item.cartItemId || `${item.id}-${item.size || 'nosize'}`}>
                    <img src={resolveCheckoutImage(item.image_url)} alt={item.name} />
                    <div className="mini-item-body">
                      <div className="mini-item-name">{item.name}</div>
                      <div className="mini-item-variant">
                        {t('checkout.piece')} / {item.size || t('checkout.oneSize')} / M
                      </div>
                      <div className="mini-item-price">${(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="checkout-card">
              <h3>{t('checkout.promoCode')}</h3>
              <div className="promo-inline">
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder={t('checkout.enterPromo')} />
                <button onClick={handleApplyPromo} type="button">{t('checkout.apply')}</button>
              </div>
              <div className="promo-hint">
                {t('checkout.availableCodes')}: <strong>SAVE25</strong>, <strong>SAVE30</strong>, <strong>SAVE50</strong>
              </div>
              {appliedPromo && (
                <div className="promo-applied">
                  {t('checkout.appliedLabel')}: {appliedPromo.code} (-{appliedPromo.discount}%)
                  <button type="button" onClick={removePromo}>{t('checkout.remove')}</button>
                </div>
              )}
            </section>

            <section className="checkout-card summary-card">
              <h3>{t('checkout.orderSummary')}</h3>
              <div className="summary-line">
                <span>{t('checkout.subtotal')}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {appliedPromo && (
                <div className="summary-line">
                  <span>{t('checkout.discount')} ({appliedPromo.code})</span>
                  <span>-{appliedPromo.discount}%</span>
                </div>
              )}
              <div className="summary-line"><span>{t('checkout.shipping')}</span><span>-</span></div>
              <div className="summary-line total"><span>{t('checkout.total')}</span><span>${Number(total).toFixed(2)}</span></div>
              <button className="place-order-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? t('checkout.processing') : t('checkout.placeOrder')}
              </button>
              {status && <div className={`checkout-status ${statusTone}`}>{status}</div>}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
