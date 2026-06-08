'use client';

import { useEffect, useMemo, useState } from 'react';
import './admin.css';
import { defaultHomeMedia, getHomeMedia, saveHomeMedia } from '../../src/lib/homeMedia';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

const initialProductForm = {
  name: '',
  description: '',
  price: '',
  cost_price: '',
  productType: 'shoe',
  sizes: [],
  stockBySize: {},
  categories: [],
  image_url: '',
};

const PRODUCT_TYPE_OPTIONS = {
  shoe: {
    label: 'Giày',
    sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  },
  shirt: {
    label: 'Áo',
    sizes: ['Freesize', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  socks: {
    label: 'Tất',
    sizes: ['Freesize'],
  },
  ball: {
    label: 'Bóng',
    sizes: ['4', '5'],
  },
};
const heroSlotLabels = ['Hero Slide 1', 'Hero Slide 2'];
const featuredSlotLabels = ['Tee Warm Up', 'Jerseys', 'Socks', 'Shoes'];
const shopSlotLabels = ['All Star NBA 2026', 'Basketball Shoes', 'Ball Basketball', 'Socks', 'Jerseys', 'Tee Shirt'];

function inferProductTypeFromSizes(sizes) {
  const normalized = (Array.isArray(sizes) ? sizes : []).map((size) => String(size).trim().toLowerCase());
  if (!normalized.length) return 'shoe';
  if (normalized.every((size) => ['4', '5'].includes(size))) return 'ball';
  if (normalized.length === 1 && normalized[0] === 'freesize') return 'socks';
  if (normalized.some((size) => ['s', 'm', 'l', 'xl', 'xxl'].includes(size)) || normalized.includes('freesize')) return 'shirt';
  return 'shoe';
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('background');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roles, setRoles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, revenue: 0, sales: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState('new');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSort, setUserSort] = useState('new');
  const [showUserFilters, setShowUserFilters] = useState(false);
  const [showUserMenuId, setShowUserMenuId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', roles: 'user' });
  const [createdFilter, setCreatedFilter] = useState('');
  const [salesFilter, setSalesFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [newCategory, setNewCategory] = useState('');
  const [showBackgroundPreview, setShowBackgroundPreview] = useState(true);
  const [homeMedia, setHomeMedia] = useState(defaultHomeMedia);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderSort, setOrderSort] = useState({ key: 'created_at', direction: 'desc' });

  useEffect(() => {
    setHomeMedia(getHomeMedia());
    fetchDashboard();
    fetchCategories();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.user-menu-wrap')) {
        setShowUserMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!showProductModal) return;

    if (!editingProduct) {
      setProductForm(initialProductForm);
      return;
    }

    let cancelled = false;

    const loadProductForm = async () => {
      try {
        const sizeData = await apiFetch(`/products/${editingProduct.id}/sizes`);
        if (cancelled) return;

        const sizes = Array.isArray(sizeData.sizes) ? sizeData.sizes : [];
        const stockBySize = {};
        sizes.forEach((item) => {
          stockBySize[item.size] = String(item.stock ?? '');
        });

        setProductForm({
          name: editingProduct.name || '',
          description: editingProduct.description || '',
          price: editingProduct.price || '',
          cost_price: editingProduct.cost_price || '',
          productType: inferProductTypeFromSizes(sizes.map((item) => item.size)),
          sizes: sizes.map((item) => item.size),
          stockBySize,
          categories: String(editingProduct.category || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          image_url: editingProduct.image_url || '',
        });
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      }
    };

    loadProductForm();

    return () => {
      cancelled = true;
    };
  }, [showProductModal, editingProduct]);

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

  const fetchCategories = async () => {
    try {
      const data = await apiFetch('/categories');
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/products?limit=200');
      setProducts(data.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setOrderDetail(null);
    setOrderDetailLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/users?limit=200');
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await apiFetch('/admin/roles');
      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    return [...users]
      .filter((user) => {
        const name = String(user.name || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();
        const roles = String(user.roles || 'user').toLowerCase();
        const matchesSearch = !term || name.includes(term) || email.includes(term);
        const matchesRole = userRoleFilter === 'all' || roles.includes(userRoleFilter.toLowerCase());
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (userSort === 'old') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        if (userSort === 'new') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        if (userSort === 'az') return String(a.name || '').localeCompare(String(b.name || ''));
        if (userSort === 'za') return String(b.name || '').localeCompare(String(a.name || ''));
        return 0;
      });
  }, [users, userSearch, userRoleFilter, userSort]);

  const userRoleOptions = useMemo(() => {
    return roles
      .map((role) => String(role.name || '').trim().toLowerCase())
      .filter((role) => ['admin', 'user'].includes(role));
  }, [roles]);

  const openUserEdit = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      roles: String(user.roles || 'user').split(',')[0].trim().toLowerCase() === 'admin' ? 'admin' : 'user',
    });
    setShowUserMenuId(null);
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        roles: [userForm.roles === 'admin' ? 'admin' : 'user'],
      };
      const data = await apiFetch(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setUsers((prev) => prev.map((user) => (
        user.id === editingUser.id ? { ...user, ...data.user } : user
      )));
      setShowUserModal(false);
      setEditingUser(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bạn chắc chắn muốn xóa user này?')) return;
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setShowUserMenuId(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return [...products]
      .filter((product) => {
        const matchesName = !term || (product.name || '').toLowerCase().includes(term);
        const matchesCreated = !createdFilter || (product.created_at || '').slice(0, 10) === createdFilter;
        const matchesSales = !salesFilter || Number(product.sold_quantity || 0) >= Number(salesFilter);
        const matchesStock = !stockFilter || Number(product.stock_quantity || 0) <= Number(stockFilter);
        return matchesName && matchesCreated && matchesSales && matchesStock;
      })
      .sort((a, b) => {
        if (productSort === 'az') return String(a.name || '').localeCompare(String(b.name || ''));
        if (productSort === 'za') return String(b.name || '').localeCompare(String(a.name || ''));
        if (productSort === 'old') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        if (productSort === 'new') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        return 0;
      });
  }, [products, productSearch, createdFilter, salesFilter, stockFilter, productSort]);

  const totalStockFromSizes = useMemo(() => {
    return productForm.sizes.reduce((sum, size) => {
      const value = Number(productForm.stockBySize[size] || 0);
      return sum + value;
    }, 0);
  }, [productForm.sizes, productForm.stockBySize]);

  const availableSizeOptions = PRODUCT_TYPE_OPTIONS[productForm.productType]?.sizes || PRODUCT_TYPE_OPTIONS.shoe.sizes;

  const syncHomeMediaState = (updater) => {
    setHomeMedia((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveHomeMedia(next);
      return next;
    });
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProductForm((prev) => ({ ...prev, image_url: reader.result || '' }));
    };
    reader.readAsDataURL(file);
  };

  const toggleSize = (size) => {
    setProductForm((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      const stockBySize = { ...prev.stockBySize };
      if (!sizes.includes(size)) {
        delete stockBySize[size];
      }
      return { ...prev, sizes, stockBySize };
    });
  };

  const updateStockBySize = (size, value) => {
    setProductForm((prev) => ({
      ...prev,
      stockBySize: { ...prev.stockBySize, [size]: value },
    }));
  };

  const handleAddCategory = async () => {
    const value = newCategory.trim();
    if (!value) return;
    const exists = categories.some((c) => String(c.name || c).toLowerCase() === value.toLowerCase());
    if (!exists) {
      setCategories((prev) => [...prev, { id: `local-${Date.now()}`, name: value }]);
    }
    setProductForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(value) ? prev.categories : [...prev.categories, value],
    }));
    setNewCategory('');
  };

  const handleProductTypeChange = (nextType) => {
    const allowedSizes = PRODUCT_TYPE_OPTIONS[nextType]?.sizes || [];
    setProductForm((prev) => {
      const nextSizes = prev.sizes.filter((size) => allowedSizes.includes(size));
      const nextStockBySize = {};
      nextSizes.forEach((size) => {
        nextStockBySize[size] = prev.stockBySize[size] || '';
      });

      return {
        ...prev,
        productType: nextType,
        sizes: nextSizes,
        stockBySize: nextStockBySize,
      };
    });
  };

  const handleSaveProduct = async () => {
    try {
      const payload = {
        ...productForm,
        categories: productForm.categories,
        sizes: productForm.sizes,
        stockBySize: productForm.stockBySize,
        stock_quantity: totalStockFromSizes,
      };
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/admin/products/${editingProduct.id}` : '/admin/products';
      const saved = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let productId = saved?.product?.id || saved?.id || editingProduct?.id;
      if (!productId && !editingProduct && productForm.name) {
        const refreshed = await apiFetch('/admin/products?limit=200');
        const found = (refreshed.products || []).find((item) => String(item.name || '').trim().toLowerCase() === String(productForm.name || '').trim().toLowerCase());
        productId = found?.id;
      }
      if (productId && productForm.sizes.length > 0) {
        await apiFetch('/product-sizes/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            sizes: productForm.sizes.map((size) => ({
              size,
              stock: Number(productForm.stockBySize[size] || 0),
            })),
          }),
        });
      }

      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm(initialProductForm);
      fetchProducts();
      fetchDashboard();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (e) {
      setError(e.message);
    }
  };

  const openMediaPicker = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) input.click();
  };

  const updateMediaSlot = (section, index, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result || '');
      syncHomeMediaState((prev) => {
        const nextList = [...prev[section]];
        nextList[index] = imageUrl;
        return { ...prev, [section]: nextList };
      });
    };
    reader.readAsDataURL(file);
  };

  const clearMediaSlot = (section, index) => {
    syncHomeMediaState((prev) => {
      const nextList = [...prev[section]];
      nextList[index] = '';
      return { ...prev, [section]: nextList };
    });
  };

  const resetHomeMedia = () => {
    syncHomeMediaState(defaultHomeMedia);
  };

  const renderMediaField = (section, index, label, className) => {
    const imageUrl = homeMedia[section]?.[index] || '';
    const inputId = `${section}-${index}`;

    return (
      <div className={`media-editable ${className || ''}`} key={`${section}-${index}`}>
        <input
          id={inputId}
          className="media-input"
          type="file"
          accept="image/*"
          onChange={(e) => updateMediaSlot(section, index, e.target.files?.[0])}
        />
        {imageUrl ? (
          <img src={imageUrl} alt={label} />
        ) : (
          <div className="media-empty-state">{label}</div>
        )}
        <div className="media-overlay">
          <div className="media-overlay-content">
            <strong>{label}</strong>
            <div className="inline-actions">
              <button type="button" className="btn-primary" onClick={() => openMediaPicker(inputId)}>
                {imageUrl ? 'Replace' : 'Add'}
              </button>
              {imageUrl ? (
                <button type="button" className="btn-danger" onClick={() => clearMediaSlot(section, index)}>
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <aside className="admin-sidebar">
      <div className="brand-card">
        <div className="brand-logo">SS</div>
        <div>
          <div className="brand-name">ShoeShoe</div>
          <div className="brand-sub">Admin Console</div>
        </div>
      </div>

      <nav className="admin-menu">
        {[
          ['background', 'Edit Background'],
          ['dashboard', 'Dashboard'],
          ['products', 'Products'],
          ['orders', 'Orders'],
          ['users', 'Users'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`menu-item ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );

  const renderDashboard = () => (
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
  );

  const renderBackground = () => (
    <section className="panel-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Home</p>
          <h2>Edit Background</h2>
        </div>
        <div className="inline-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowBackgroundPreview((v) => !v)}>
            {showBackgroundPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button type="button" className="btn-danger" onClick={resetHomeMedia}>
            Reset Default
          </button>
        </div>
      </div>
      {showBackgroundPreview ? (
        <div className="home-media-editor">
          <div className="home-media-section">
            <div className="home-media-heading">
              <span className="eyebrow">Hero</span>
              <h3>Home Background</h3>
            </div>
            <div className="home-hero-preview">
              {heroSlotLabels.map((label, index) => renderMediaField('heroImages', index, label, 'home-hero-slot'))}
            </div>
          </div>

          <div className="home-media-section">
            <div className="home-media-heading">
              <span className="eyebrow">Featured</span>
              <h3>Featured Products</h3>
            </div>
            <div className="home-featured-preview">
              {featuredSlotLabels.map((label, index) => renderMediaField('featuredImages', index, label, 'home-featured-slot'))}
            </div>
          </div>

          <div className="home-media-section">
            <div className="home-media-heading">
              <span className="eyebrow">Categories</span>
              <h3>Shop by Basketball</h3>
            </div>
            <div className="home-shop-preview">
              {shopSlotLabels.map((label, index) => renderMediaField('shopByBasketballImages', index, label, 'home-shop-slot'))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );

  const renderProducts = () => (
    <section className="panel-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2>Products</h2>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingProduct(null);
            setProductForm(initialProductForm);
            setShowProductModal(true);
          }}
        >
          + Add New Product
        </button>
      </div>

      <div className="toolbar-grid">
        <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Filter by name" />
        <input type="date" value={createdFilter} onChange={(e) => setCreatedFilter(e.target.value)} />
        <input type="number" min="0" value={salesFilter} onChange={(e) => setSalesFilter(e.target.value)} placeholder="Min sold" />
        <input type="number" min="0" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} placeholder="Max stock" />
        <select value={productSort} onChange={(e) => setProductSort(e.target.value)}>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
          <option value="old">Oldest</option>
          <option value="new">Newest</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Cost Price</th>
              <th>Sold</th>
              <th>Sales</th>
              <th>Profit</th>
              <th>Stock</th>
              <th>Created</th>
              <th>Categories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10">Loading...</td>
              </tr>
            ) : visibleProducts.length ? (
              visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      {product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="thumb-fallback" />}
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.description}</span>
                      </div>
                    </div>
                  </td>
                  <td>${Number(product.price || 0).toFixed(2)}</td>
                  <td>${Number(product.cost_price || 0).toFixed(2)}</td>
                  <td>{product.sold_quantity || 0}</td>
                  <td>${Number(product.sales_amount || 0).toFixed(2)}</td>
                  <td>${Number(product.profit || 0).toFixed(2)}</td>
                  <td>{product.stock_quantity || 0}</td>
                  <td>{product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}</td>
                  <td>{product.category || '-'}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn-secondary" onClick={() => { setEditingProduct(product); setShowProductModal(true); }}>
                        Edit
                      </button>
                      <button type="button" className="btn-danger" onClick={() => handleDeleteProduct(product.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderOrders = () => (
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
  );

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

  const renderUsers = () => (
    <section className="panel-card users-page">
      <div className="panel-header users-header">
        <div>
          <p className="eyebrow">Accounts</p>
          <h2>{filteredUsers.length} Users</h2>
        </div>
        <div className="users-header-actions">
          <div className="users-search">
            <span>⌕</span>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search a user"
            />
          </div>
          <button type="button" className="btn-secondary" onClick={() => setShowUserFilters((v) => !v)}>
            Filter
          </button>
        </div>
      </div>

      {showUserFilters && (
        <div className="users-filter-panel">
          <label>
            <span>Role</span>
            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
              <option value="all">All roles</option>
              {userRoleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select value={userSort} onChange={(e) => setUserSort(e.target.value)}>
              <option value="new">Newest</option>
              <option value="old">Oldest</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
          </label>
          <div className="inline-actions users-filter-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setUserSearch('');
                setUserRoleFilter('all');
                setUserSort('new');
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="users-grid">
        {filteredUsers.length ? filteredUsers.map((user) => {
          const initial = String(user.name || user.email || 'U').trim().charAt(0).toUpperCase();
          const joined = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
          const menuOpen = showUserMenuId === user.id;

          return (
            <article className="user-card" key={user.id}>
              <div className="user-card-top">
                <div className="user-avatar">{initial}</div>
                  <div className="user-menu-wrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="icon-button user-card-menu"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserMenuId(menuOpen ? null : user.id);
                      }}
                    >
                      ...
                    </button>
                    {menuOpen && (
                      <div
                        className="user-menu-popover"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => openUserEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              <div className="user-card-body">
                <strong>{user.name || 'Guest'}</strong>
                <p>{String(user.roles || 'user')}</p>
                <div className="user-meta">
                  <div><span>Department</span><strong>{String(user.roles || 'user').split(',')[0] || 'User'}</strong></div>
                  <div><span>Joined</span><strong>{joined}</strong></div>
                </div>
                <div className="user-contact">
                  <div>✉ {user.email}</div>
                  <div>☎ {user.id}</div>
                </div>
              </div>
            </article>
          );
        }) : (
          <div className="empty-state">No users found.</div>
        )}
      </div>
    </section>
  );

  const renderUserModal = () => (
    <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
      <div className="modal-card user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Users</p>
            <h3>Edit User</h3>
          </div>
          <button type="button" className="icon-button" onClick={() => setShowUserModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input value={userForm.name} onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))} />
            </label>
            <label>
              <span>Email</span>
              <input value={userForm.email} onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} />
            </label>
            <label className="full">
              <span>Roles</span>
              <select
                value={userForm.roles}
                onChange={(e) => setUserForm((prev) => ({ ...prev, roles: e.target.value === 'admin' ? 'admin' : 'user' }))}
              >
                {userRoleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSaveUser}>Save</button>
            </div>
        </div>
      </div>
    </div>
  );

  const renderProductModal = () => (
    <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Products</p>
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          </div>
          <button type="button" className="icon-button" onClick={() => setShowProductModal(false)}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <label>
              <span>Tên sản phẩm</span>
              <input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label className="full">
              <span>Mô tả sản phẩm</span>
              <textarea value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} rows="4" />
            </label>
            <label>
              <span>Giá bán</span>
              <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} />
            </label>
            <label>
              <span>Giá nhập</span>
              <input type="number" step="0.01" value={productForm.cost_price} onChange={(e) => setProductForm((p) => ({ ...p, cost_price: e.target.value }))} />
            </label>
            <label>
              <span>Loại sản phẩm</span>
              <select value={productForm.productType} onChange={(e) => handleProductTypeChange(e.target.value)}>
                {Object.entries(PRODUCT_TYPE_OPTIONS).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Tổng số lượng</span>
              <input type="number" value={totalStockFromSizes} readOnly />
            </label>
            <div className="full">
              <span>Size</span>
              <div className="chip-grid">
                {availableSizeOptions.map((size) => (
                  <button key={size} type="button" className={`chip ${productForm.sizes.includes(size) ? 'active' : ''}`} onClick={() => toggleSize(size)}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="full">
              <span>Số lượng theo size</span>
              <div className="size-stock-grid">
                {productForm.sizes.length ? productForm.sizes.map((size) => (
                  <label key={size}>
                    <span>Size {size}</span>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stockBySize[size] || ''}
                      onChange={(e) => updateStockBySize(size, e.target.value)}
                    />
                  </label>
                )) : <p className="muted">Chọn size trước để nhập số lượng theo size.</p>}
              </div>
            </div>
            <div className="full">
              <span>Danh mục</span>
              <div className="category-row">
                <select
                  multiple
                  value={productForm.categories}
                  onChange={(e) => setProductForm((p) => ({ ...p, categories: Array.from(e.target.selectedOptions).map((o) => o.value) }))}
                >
                  {categories.map((cat) => (
                    <option key={cat.id || cat.name || cat} value={cat.name || cat}>{cat.name || cat}</option>
                  ))}
                </select>
                <div className="category-add">
                  <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Thêm danh mục mới" />
                  <button type="button" className="btn-secondary" onClick={handleAddCategory}>Add</button>
                </div>
              </div>
            </div>
            <div className="full">
              <span>Ảnh sản phẩm</span>
              <input type="file" accept="image/*" onChange={handleImageSelect} />
              {productForm.image_url && (
                <div className="image-preview">
                  <img src={productForm.image_url} alt="Preview" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSaveProduct}>Save</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-shell">
      {renderSidebar()}
      <main className="admin-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">ShoeShoe Admin</p>
            <h1>{activeTab === 'background' ? 'Edit Background' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        {activeTab === 'background' && renderBackground()}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'users' && renderUsers()}
        {showProductModal && renderProductModal()}
        {showOrderModal && renderOrderModal()}
        {showUserModal && renderUserModal()}
      </main>
    </div>
  );
}
