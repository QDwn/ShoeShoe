'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import BasketballFooter from '../../src/components/BasketballFooter';
import { useLanguage } from '../../src/context/LanguageContext';
import './orders.css';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value, language) {
  if (!value) return '-';
  return new Date(value).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
}

function getStatusClass(status) {
  const value = String(status || '').toLowerCase();
  if (['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'].includes(value)) {
    return `order-status ${value}`;
  }
  return 'order-status pending';
}

function canReviewOrderItem(orderStatus, item) {
  return String(orderStatus || '').toLowerCase() === 'delivered' && Number(item?.product_id || item?.id || 0) > 0;
}

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOrders = async (targetUserId) => {
    const res = await fetch(`/api/orders/my?userId=${targetUserId}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || t('orders.failedToLoadOrders'));
    return Array.isArray(data.orders) ? data.orders : [];
  };

  const loadOrderDetail = async (targetUserId, orderId) => {
    const res = await fetch(`/api/orders/my/${orderId}?userId=${targetUserId}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || t('orders.failedToLoadOrderDetail'));
    return data.order || null;
  };

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    syncUser();
    window.addEventListener('user-changed', syncUser);
    return () => window.removeEventListener('user-changed', syncUser);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const nextOrders = await loadOrders(user.id);
        if (!cancelled) setOrders(nextOrders);
      } catch (err) {
        if (!cancelled) setError(err.message || t('orders.failedToLoadOrders'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, t]);

  useEffect(() => {
    if (!user?.id) return;

    const interval = window.setInterval(async () => {
      try {
        const nextOrders = await loadOrders(user.id);
        setOrders(nextOrders);
        if (detail?.id) {
          const nextDetail = await loadOrderDetail(user.id, detail.id);
          setDetail(nextDetail);
        }
      } catch {
        // keep current UI if refresh fails
      }
    }, 20000);

    return () => window.clearInterval(interval);
  }, [user?.id, detail?.id, t]);

  const openOrderDetail = async (orderId) => {
    if (!user?.id) return;
    setDetailLoading(true);
    setDetail({ id: orderId });
    try {
      const nextDetail = await loadOrderDetail(user.id, orderId);
      setDetail(nextDetail);
    } catch (err) {
      setError(err.message || t('orders.failedToLoadOrderDetail'));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailLoading(false);
  };

  const orderSummary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.count += 1;
        acc.total += Number(order.total || 0);
        return acc;
      },
      { count: 0, total: 0 }
    );
  }, [orders]);

  return (
    <div className="orders-page">
      <Navbar />
      <div className="orders-shell">
        <header className="orders-header">
          <div>
            <p className="orders-eyebrow">{t('nav.trackOrders')}</p>
            <h1>{t('orders.title')}</h1>
            <p>{t('orders.subtitle')}</p>
          </div>
          {user?.id ? (
            <div className="orders-summary-card">
              <span>{orderSummary.count} {t('cart.items')}</span>
              <strong>{formatMoney(orderSummary.total)}</strong>
            </div>
          ) : null}
        </header>

        {!user?.id ? (
          <section className="orders-empty-state">
            <h2>{t('orders.loginTitle')}</h2>
            <p>{t('orders.loginText')}</p>
            <div className="orders-empty-actions">
              <Link href="/register" className="orders-primary-btn">{t('orders.register')}</Link>
              <Link href="/login" className="orders-secondary-btn">{t('orders.signIn')}</Link>
            </div>
          </section>
        ) : loading ? (
          <section className="orders-loading">{t('orders.loadingOrders')}</section>
        ) : error ? (
          <section className="orders-loading">{error}</section>
        ) : orders.length === 0 ? (
          <section className="orders-empty-state">
            <h2>{t('orders.empty')}</h2>
          </section>
        ) : (
          <section className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-top">
                  <div>
                    <p className="order-code">{t('orders.orderCode')} #{order.id}</p>
                    <h3>{formatDate(order.created_at, language)}</h3>
                  </div>
                  <span className={getStatusClass(order.status)}>{order.status}</span>
                </div>

                <div className="order-card-grid">
                  <div>
                    <span>{t('orders.itemCount')}</span>
                    <strong>{order.item_count}</strong>
                  </div>
                  <div>
                    <span>{t('orders.quantityTotal')}</span>
                    <strong>{order.quantity_total}</strong>
                  </div>
                  <div>
                    <span>{t('orders.total')}</span>
                    <strong>{formatMoney(order.total)}</strong>
                  </div>
                  <div>
                    <span>{t('orders.estimatedDelivery')}</span>
                    <strong>
                      {order.estimated_delivery ? formatDate(order.estimated_delivery, language) : t('orders.noEstimate')}
                    </strong>
                  </div>
                </div>

                <div className="order-card-preview">
                  {(order.items_preview || []).map((item) => (
                    <div className="order-preview-item" key={`${order.id}-${item.id}-${item.size || 'nosize'}`}>
                      {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : <div className="order-preview-fallback" />}
                      <div>
                        <strong>{item.product_name}</strong>
                        <span>x{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-card-actions">
                  <div className="order-meta-pair">
                    <span>{t('orders.paymentMethod')}</span>
                    <strong>{order.payment_method}</strong>
                  </div>
                  <button type="button" className="orders-primary-btn" onClick={() => openOrderDetail(order.id)}>
                    {t('orders.viewDetails')}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {detail ? (
        <div className="orders-modal" role="dialog" aria-modal="true">
          <div className="orders-modal-backdrop" onClick={closeDetail} />
          <div className="orders-modal-panel">
            <div className="orders-modal-head">
              <div>
                <p className="orders-eyebrow">{t('orders.detailTitle')}</p>
                <h2>{t('orders.orderCode')} #{detail.id}</h2>
              </div>
              <button type="button" className="orders-close-btn" onClick={closeDetail}>
                {t('orders.close')}
              </button>
            </div>

            {detailLoading ? (
              <div className="orders-loading">{t('orders.loadingOrderDetail')}</div>
            ) : (
              <>
                <div className="orders-detail-grid">
                  <section className="orders-detail-card">
                    <h3>{t('orders.customerInfo')}</h3>
                    <div className="orders-detail-pairs">
                      <div><span>{t('orders.name')}</span><strong>{detail.customer_name || '-'}</strong></div>
                      <div><span>{t('orders.email')}</span><strong>{detail.customer_email || '-'}</strong></div>
                      <div><span>{t('orders.phone')}</span><strong>{detail.customer_phone || '-'}</strong></div>
                      <div><span>{t('orders.address')}</span><strong>{detail.shipping_address || '-'}</strong></div>
                    </div>
                  </section>

                  <section className="orders-detail-card">
                    <h3>{t('orders.status')}</h3>
                    <div className="orders-detail-pairs">
                      <div><span>{t('orders.status')}</span><strong className={getStatusClass(detail.status)}>{detail.status}</strong></div>
                      <div><span>{t('orders.paymentMethod')}</span><strong>{detail.payment_method || '-'}</strong></div>
                      <div><span>{t('orders.paymentStatus')}</span><strong>{detail.payment_status || '-'}</strong></div>
                      <div><span>{t('orders.createdAt')}</span><strong>{formatDate(detail.created_at, language)}</strong></div>
                      <div><span>{t('orders.coupon')}</span><strong>{detail.coupon_code || '-'}</strong></div>
                      <div>
                        <span>{detail.status === 'delivered' ? t('orders.deliveredOn') : t('orders.estimatedDelivery')}</span>
                        <strong>
                          {detail.estimated_delivery ? formatDate(detail.estimated_delivery, language) : t('orders.noEstimate')}
                        </strong>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="orders-detail-card">
                  <h3>{t('orders.orderItems')}</h3>
                  <div className="orders-items-table">
                    <div className="orders-items-head">
                      <span>{t('orders.product')}</span>
                      <span>{t('orders.quantity')}</span>
                      <span>{t('orders.beforeDiscount')}</span>
                      <span>{t('orders.afterDiscount')}</span>
                    </div>
                    {(detail.items || []).map((item) => (
                      <div className="orders-items-row" key={`${detail.id}-${item.id}-${item.size || 'nosize'}`}>
                        <div className="orders-item-product">
                          {item.image_url ? <img className="orders-detail-thumb" src={item.image_url} alt={item.product_name} /> : <div className="order-preview-fallback orders-detail-thumb" />}
                          <div>
                            <strong>{item.product_name}</strong>
                            <span>{item.size ? `${t('cart.size')}: ${item.size}` : t('orders.oneSize')}</span>
                            {canReviewOrderItem(detail.status, item) ? (
                              <Link
                                href={`/product/${item.product_id || item.id}#reviews`}
                                className="orders-review-link"
                                onClick={closeDetail}
                              >
                                {t('orders.reviewProduct')}
                              </Link>
                            ) : null}
                          </div>
                        </div>
                        <span>{item.quantity}</span>
                        <span>{formatMoney(item.subtotal)}</span>
                        <span>{formatMoney(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="orders-detail-card orders-total-card">
                  <div><span>{t('orders.subtotal')}</span><strong>{formatMoney(detail.subtotal)}</strong></div>
                  <div><span>{t('orders.discount')}</span><strong>- {formatMoney(detail.discount_amount)}</strong></div>
                  <div><span>{t('orders.total')}</span><strong>{formatMoney(detail.total)}</strong></div>
                </section>
              </>
            )}
          </div>
        </div>
      ) : null}

      <BasketballFooter />
    </div>
  );
}
