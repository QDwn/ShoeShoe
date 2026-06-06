'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import './checkout.css';

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    email: '',
    country: 'United States',
    address: '',
    region: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      setIsLoggedIn(!!storedUser);

      const checkoutRaw = localStorage.getItem('checkout_state');
      const cartRaw = localStorage.getItem('checkout_cart');
      const buyNowRaw = localStorage.getItem('buy_now_item');
      const raw = checkoutRaw || cartRaw || buyNowRaw;
      if (!raw) {
        router.replace('/cart');
        return;
      }
      const parsed = JSON.parse(raw);
      setItems(Array.isArray(parsed.items) ? parsed.items : [parsed]);
      if (parsed.promo && parsed.promo.code && parsed.promo.discount) {
        setAppliedPromo({
          code: parsed.promo.code,
          discount: parsed.promo.discount
        });
        setPromoCode(parsed.promo.code);
      }
      if (typeof parsed.subtotal === 'number') {
        setSubtotal(parsed.subtotal);
      }
      if (typeof parsed.total === 'number') {
        setSubtotal(parsed.subtotal);
      }
    } catch {
      router.replace('/cart');
    }
  }, [router]);

  useEffect(() => {
    const base = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
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
      setStatus('Please enter a promo code.');
      return;
    }

    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        setAppliedPromo(null);
        setStatus(data.message || 'Invalid promo code.');
        return;
      }

      setAppliedPromo({
        code: data.coupon.code,
        discount: data.coupon.discount_percent
      });
      setStatus(`Promo code ${data.coupon.code} applied: ${data.coupon.discount_percent}% off.`);
    } catch (error) {
      setAppliedPromo(null);
      setStatus(error.message || 'Invalid promo code.');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setStatus('Promo code removed.');
  };

  const handleSubmit = async () => {
    if (!items.length) return;
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.region) {
      setStatus('Please enter all shipping information.');
      return;
    }

    setLoading(true);
    setStatus('Processing payment...');

    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = storedUser ? JSON.parse(storedUser) : null;

      const payload = {
        shipping: {
          name: shipping.name,
          email: shipping.email || null,
          address: `${shipping.address}, ${shipping.region}, ${shipping.country}`,
          phone: shipping.phone
        },
        items,
        total,
        paymentMethod,
        userId: user?.id || null,
        couponCode: appliedPromo?.code || null
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment failed');

      localStorage.removeItem('buy_now_item');
      localStorage.removeItem('checkout_cart');
      localStorage.removeItem('checkout_state');
      setStatus(`Order placed successfully. Order #${data.orderId}`);
      setTimeout(() => router.push('/cart'), 1200);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-shell">
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="checkout-shell">
        {!isLoggedIn && (
          <div className="checkout-top-login">
            <div>Log in for a faster checkout and more benefits</div>
            <Link href="/login" className="checkout-login-btn">Log in</Link>
          </div>
        )}

        <div className="checkout-layout">
          <div className="checkout-left">
            <section className="checkout-card">
              <h2>Shipping information</h2>
              <div className="checkout-grid">
                <input placeholder="Full name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />
                <input placeholder="Phone number" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                <input placeholder="Email (optional)" type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} />
                <input placeholder="Country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
                <input placeholder="Street address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
                <input placeholder="City / State / ZIP" value={shipping.region} onChange={(e) => setShipping({ ...shipping, region: e.target.value })} />
              </div>
            </section>

            <section className="checkout-card">
              <h2>Payment method</h2>
              <label className={`pay-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                Cash on delivery (COD)
              </label>
              <label className={`pay-option ${paymentMethod === 'bank' ? 'active' : ''}`}>
                <input type="radio" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                Bank transfer
              </label>
              <label className={`pay-option ${paymentMethod === 'wallet' ? 'active' : ''}`}>
                <input type="radio" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                Payment wallet
              </label>
            </section>

            <section className="checkout-card">
              <input className="checkout-note" placeholder="Order notes" />
            </section>
          </div>

          <aside className="checkout-right">
            <section className="checkout-card">
              <h3>Cart</h3>
              <div className="checkout-item-list">
                {items.map((it) => (
                  <div className="mini-item" key={it.cartItemId || `${it.id}-${it.size || 'nosize'}`}>
                    <img src={it.image_url} alt={it.name} />
                    <div className="mini-item-body">
                      <div className="mini-item-name">{it.name}</div>
                      <div className="mini-item-variant">Piece / {it.size || 'One size'} / M</div>
                      <div className="mini-item-price">${(Number(it.price) * Number(it.quantity || 1)).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="checkout-card">
              <h3>Promo code</h3>
              <div className="promo-inline">
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Enter promo code" />
                <button onClick={handleApplyPromo} type="button">Apply</button>
              </div>
              <div className="promo-hint">
                Available codes: <strong>SAVE25</strong>, <strong>SAVE30</strong>, <strong>SAVE50</strong>
              </div>
              {appliedPromo && (
                <div className="promo-applied">
                  Applied: {appliedPromo.code} (-{appliedPromo.discount}%)
                  <button type="button" onClick={removePromo}>Remove</button>
                </div>
              )}
            </section>

            <section className="checkout-card summary-card">
              <h3>Order summary</h3>
              <div className="summary-line">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {appliedPromo && (
                <div className="summary-line">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-{appliedPromo.discount}%</span>
                </div>
              )}
              <div className="summary-line"><span>Shipping</span><span>-</span></div>
              <div className="summary-line total"><span>Total</span><span>${Number(total).toFixed(2)}</span></div>
              <button className="place-order-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Processing...' : 'Place order'}
              </button>
              {status && <div className="checkout-status">{status}</div>}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
