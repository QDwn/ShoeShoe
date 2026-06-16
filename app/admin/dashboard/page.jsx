'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageFrame from '../AdminPageFrame';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export default function AdminDashboardPage() {
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, revenue: 0, sales: 0 });

  const apiFetch = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
    return data;
  };

  const fetchDashboard = async () => {
    try {
      const data = await apiFetch('/admin/stats/dashboard');
      setStats(data.stats || {});
      const productsData = await apiFetch('/admin/products?limit=12');
      setProducts(productsData.products || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const dashboardTopProducts = useMemo(() => {
    const source = Array.isArray(stats.top_products) && stats.top_products.length
      ? stats.top_products
      : products;

    return [...source]
      .sort((a, b) => Number(b.sold_quantity || 0) - Number(a.sold_quantity || 0))
      .slice(0, 5);
  }, [products, stats.top_products]);

  const dashboardTrend = useMemo(() => {
    const baseSales = Number(stats.sales || 0);
    const baseRevenue = Number(stats.revenue || 0);
    const salesSeries = [20, 34, 28, 52, 45, 63, 48, 72, 66, 84, 69, 91].map((n, index) => {
      const modifier = baseSales ? Math.min(18, Math.round(baseSales / 1000)) : 0;
      return n + modifier + (index % 3 === 0 ? 4 : 0);
    });
    const profitSeries = [16, 29, 24, 48, 37, 58, 41, 62, 57, 74, 60, 81].map((n, index) => {
      const modifier = baseRevenue ? Math.min(16, Math.round(baseRevenue / 1200)) : 0;
      return n + modifier + (index % 4 === 1 ? 3 : 0);
    });

    return { salesSeries, profitSeries };
  }, [stats.sales, stats.revenue]);

  const chartPath = (values) => {
    if (!values.length) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const width = 100;
    const height = 100;
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const normalized = max === min ? 50 : 12 + ((value - min) / (max - min)) * 76;
        const y = height - normalized;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  };

  return (
    <AdminPageFrame activeTab="dashboard" title="Dashboard" error={error}>
      <section className="dashboard-shell">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">Welcome, Grind Hoops</p>
            <h2>Here is what happening in your store.</h2>
          </div>
          <div className="dashboard-chip-row">
            <span className="dashboard-chip">Orders {stats.orders || 0}</span>
            <span className="dashboard-chip">Profit ${Number(stats.revenue || 0).toFixed(2)}</span>
            <span className="dashboard-chip">Revenue ${Number(stats.sales || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="dashboard-frame">
          <div className="dashboard-sidebar-stack">
            <div className="dashboard-card dashboard-main-stat pastel-warm">
              <div className="dashboard-stat-icon">$</div>
              <div>
                <p>Total Revenue</p>
                <strong>${Number(stats.sales || 0).toFixed(2)}</strong>
                <span>From completed orders</span>
              </div>
            </div>
            <div className="dashboard-card dashboard-main-stat pastel-lavender">
              <div className="dashboard-stat-icon">#</div>
              <div>
                <p>Total Orders</p>
                <strong>{stats.orders || 0}</strong>
                <span>All-time order count</span>
              </div>
            </div>
            <div className="dashboard-card dashboard-main-stat pastel-cyan">
              <div className="dashboard-stat-icon">U</div>
              <div>
                <p>Total Customers</p>
                <strong>{stats.users || 0}</strong>
                <span>Registered accounts</span>
              </div>
            </div>
            <div className="dashboard-card dashboard-main-stat pastel-ink">
              <div className="dashboard-sales-strip">
                <div className="sales-row">
                  <span>Revenue</span>
                  <strong>${Number(stats.sales || 0).toFixed(2)}</strong>
                </div>
                <div className="sales-row">
                  <span>Profit</span>
                  <strong>${Number(stats.revenue || 0).toFixed(2)}</strong>
                </div>
                <div className="sales-row">
                  <span>Products</span>
                  <strong>{stats.products || 0}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-content-stack">
            <div className="dashboard-card dashboard-chart-card dashboard-chart-wide">
              <div className="dashboard-card-head">
                <div>
                  <h3>Orders Overview</h3>
                  <p>Monthly sales and profit trend</p>
                </div>
                <select className="year-select" defaultValue="2026">
                  <option>2026</option>
                  <option>2025</option>
                  <option>2024</option>
                </select>
              </div>
              <div className="dashboard-chart-legend">
                <span><i className="legend-dot legend-sales" />Orders</span>
                <span><i className="legend-dot legend-profit" />Profit</span>
              </div>
              <div className="dashboard-line-chart">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d={chartPath(dashboardTrend.salesSeries)} className="chart-line chart-sales" />
                  <path d={chartPath(dashboardTrend.profitSeries)} className="chart-line chart-profit" />
                  {[...Array(12)].map((_, index) => (
                    <line key={index} x1={(index / 11) * 100} y1="0" x2={(index / 11) * 100} y2="100" className="chart-grid-line" />
                  ))}
                </svg>
                <div className="chart-axis">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="dashboard-bottom-grid">
              <div className="dashboard-card dashboard-donut-card">
                <div className="dashboard-card-head">
                  <div>
                    <h3>Sale Analytics</h3>
                    <p>Orders vs profit distribution</p>
                  </div>
                </div>
                <div className="donut-wrap">
                  <div className="donut-chart">
                    <div className="donut-center">
                      <strong>100%</strong>
                      <span>Completed</span>
                    </div>
                  </div>
                  <div className="donut-meta">
                    <div><span className="legend-dot legend-sales" />Sold {stats.orders || 0}</div>
                    <div><span className="legend-dot legend-profit" />Profit ${Number(stats.revenue || 0).toFixed(2)}</div>
                    <div><span className="legend-dot legend-orders" />Revenue ${Number(stats.sales || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-card dashboard-table-card">
                <div className="dashboard-card-head">
                  <div>
                    <h3>Top Products</h3>
                    <p>Best performing products</p>
                  </div>
                </div>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sold</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardTopProducts.length ? dashboardTopProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="dashboard-product-cell">
                            {product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="thumb-fallback" />}
                            <div>
                              <strong>{product.name}</strong>
                              <span>${Number(product.price || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </td>
                        <td>{product.sold_quantity || 0}</td>
                        <td>${Number(product.sales_amount || 0).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3">No product data.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminPageFrame>
  );
}
