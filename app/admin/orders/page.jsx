'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageFrame from '../AdminPageFrame';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export default function AdminOrdersPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderSort, setOrderSort] = useState({ key: 'created_at', direction: 'desc' });

  const apiFetch = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
    return data;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/orders?limit=200');
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderDetail = async (orderId) => {
    setOrderDetailLoading(true);
    setShowOrderModal(true);
    try {
      const data = await apiFetch(`/admin/orders/${orderId}`);
      setOrderDetail(data.order || null);
    } catch (e) {
      setError(e.message);
      setShowOrderModal(false);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleOrderSort = (key) => {
    setOrderSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedOrders = useMemo(() => {
    const compareValue = (order, key) => {
      const items = Array.isArray(order.items) ? order.items : [];
      switch (key) {
        case 'id':
          return Number(order.id || 0);
        case 'total_products':
          return items.length;
        case 'total_quantity':
          return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        case 'total':
          return Number(order.total || 0);
        case 'customer':
          return String(order.customer_name || order.user_name || '').toLowerCase();
        case 'phone':
          return String(order.customer_phone || '').toLowerCase();
        case 'status':
          return String(order.status || '').toLowerCase();
        case 'payment':
          return String(order.payment_method || '').toLowerCase();
        case 'created_at':
          return new Date(order.created_at || 0).getTime();
        default:
          return 0;
      }
    };

    const direction = orderSort.direction === 'asc' ? 1 : -1;
    return [...orders].sort((a, b) => {
      const av = compareValue(a, orderSort.key);
      const bv = compareValue(b, orderSort.key);

      if (typeof av === 'string' || typeof bv === 'string') {
        return av.localeCompare(bv) * direction;
      }

      return (av - bv) * direction;
    });
  }, [orders, orderSort]);

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      await apiFetch(`/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
      setOrderDetail((prev) => (prev && prev.id === orderId ? { ...prev, status } : prev));
    } catch (e) {
      setError(e.message);
    }
  };

  const getOrderStatusClass = (status) => {
    const value = String(status || '').toLowerCase();
    if (['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'].includes(value)) {
      return `status-${value}`;
    }
    return 'status-pending';
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setOrderDetail(null);
    setOrderDetailLoading(false);
  };

  const renderOrderModal = () => {
    const items = Array.isArray(orderDetail?.items) ? orderDetail.items : [];
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.line_total || item.price * (item.quantity || 0) || 0), 0);
    const discountedTotal = Number(orderDetail?.total || 0);
    const discountAmount = Math.max(0, subtotal - discountedTotal);

    return (
      <div className="modal-overlay" onClick={closeOrderModal}>
        <div className="modal-card order-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <p className="eyebrow">Orders</p>
              <h3>Order Detail #{orderDetail?.id || ''}</h3>
            </div>
            <button type="button" className="icon-button" onClick={closeOrderModal}>×</button>
          </div>

          <div className="modal-body">
            {orderDetailLoading ? (
              <div className="order-detail-empty">Loading order detail...</div>
            ) : !orderDetail ? (
              <div className="order-detail-empty">Order detail is unavailable.</div>
            ) : (
              <div className="order-detail-layout">
                <section className="order-detail-panel">
                  <div className="order-summary-grid">
                    <div className="summary-chip">
                      <span>Purchase ID</span>
                      <strong>#{orderDetail.id}</strong>
                    </div>
                    <div className="summary-chip">
                      <span>Total Products</span>
                      <strong>{items.length}</strong>
                    </div>
                    <div className="summary-chip">
                      <span>Total Quantity</span>
                      <strong>{totalQuantity}</strong>
                    </div>
                    <div className="summary-chip">
                      <span>Total Amount</span>
                      <div className="summary-price-stack">
                        <div className="summary-price-line">
                          <small>Subtotal</small>
                          <strong>${subtotal.toFixed(2)}</strong>
                        </div>
                        <div className="summary-price-line">
                          <small>Discount</small>
                          <strong className={discountAmount > 0 ? 'discount-value' : ''}>
                            -${discountAmount.toFixed(2)}
                          </strong>
                        </div>
                        <div className="summary-price-line total-line">
                          <small>Total</small>
                          <strong>${discountedTotal.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="order-detail-grid">
                  <section className="order-detail-panel">
                    <div className="order-detail-head">
                      <h4>Customer Information</h4>
                      <span className={`status-pill ${getOrderStatusClass(orderDetail.status)}`}>
                        {orderDetail.status || 'pending'}
                      </span>
                    </div>
                    <div className="detail-list">
                      <div><span>Name</span><strong>{orderDetail.customer_name || orderDetail.user_name || 'Guest'}</strong></div>
                      <div><span>Email</span><strong>{orderDetail.customer_email || orderDetail.email || '-'}</strong></div>
                      <div><span>Phone</span><strong>{orderDetail.customer_phone || '-'}</strong></div>
                      <div><span>Address</span><strong>{orderDetail.shipping_address || '-'}</strong></div>
                    </div>
                  </section>

                  <section className="order-detail-panel">
                    <div className="order-detail-head">
                      <h4>Payment & Delivery</h4>
                    </div>
                    <div className="detail-list">
                      <div><span>Payment Method</span><strong>{orderDetail.payment_method || '-'}</strong></div>
                      <div><span>Payment Status</span><strong>{orderDetail.payment_status || '-'}</strong></div>
                      <div><span>Coupon Code</span><strong>{orderDetail.coupon_code || '-'}</strong></div>
                      <div><span>Created At</span><strong>{orderDetail.created_at ? new Date(orderDetail.created_at).toLocaleString() : '-'}</strong></div>
                    </div>
                  </section>
                </div>

                <section className="order-detail-panel">
                  <div className="order-detail-head">
                    <h4>Ordered Items</h4>
                  </div>
                  <div className="order-items-table-wrap">
                    <table className="data-table order-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Size</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length ? items.map((item, index) => (
                          <tr key={`${item.product_id || 'product'}-${index}`}>
                            <td>
                              <div className="product-cell">
                                {item.image_url ? <img src={item.image_url} alt={item.product_name} /> : <div className="thumb-fallback" />}
                                <div>
                                  <strong>{item.product_name}</strong>
                                  <span>ID: {item.product_id || '-'}</span>
                                </div>
                              </div>
                            </td>
                            <td>{item.size || '-'}</td>
                            <td>{item.quantity || 0}</td>
                            <td>${Number(item.price || 0).toFixed(2)}</td>
                            <td>${Number(item.line_total || 0).toFixed(2)}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5">No order items found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminPageFrame activeTab="orders" title="Orders" error={error}>
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Sales</p>
            <h2>Orders</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('id')}>Purchase ID</button></th>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('total_products')}>Total Products</button></th>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('total_quantity')}>Total Quantity</button></th>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('total')}>Total Amount</button></th>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('customer')}>Customer</button></th>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('phone')}>Phone</button></th>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('status')}>Status</button></th>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('payment')}>Payment</button></th>
                <th><button type="button" className="sort-th" onClick={() => handleOrderSort('created_at')}>Date</button></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10">Loading...</td>
                </tr>
              ) : sortedOrders.length ? (
                sortedOrders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const totalProducts = items.length;
                  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

                  return (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{totalProducts}</td>
                      <td>{totalQuantity}</td>
                      <td>${Number(order.total || order.total_price || 0).toFixed(2)}</td>
                      <td>{order.customer_name || order.user_name || 'Guest'}</td>
                      <td>{order.customer_phone || '-'}</td>
                      <td>
                        <select
                          className={`status-select ${getOrderStatusClass(order.status)}`}
                          value={order.status || 'pending'}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>{order.payment_method || '-'}</td>
                      <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                      <td>
                        <button type="button" className="btn-secondary" onClick={() => openOrderDetail(order.id)}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showOrderModal && renderOrderModal()}
    </AdminPageFrame>
  );
}
