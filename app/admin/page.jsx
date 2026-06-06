'use client';

import { useEffect, useMemo, useState } from 'react';
import './admin.css';
import { defaultHomeMedia, getHomeMedia, saveHomeMedia } from '../../src/lib/homeMedia';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

const initialProductForm = {
  name: '',
  description: '',
  price: '',
  sizes: [],
  stockBySize: {},
  categories: [],
  image_url: '',
};

const sizeOptions = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const heroSlotLabels = ['Hero Slide 1', 'Hero Slide 2'];
const featuredSlotLabels = ['Tee Warm Up', 'Jerseys', 'Socks', 'Shoes'];
const shopSlotLabels = ['All Star NBA 2026', 'Basketball Shoes', 'Ball Basketball', 'Socks', 'Jerseys', 'Tee Shirt'];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('background');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState('new');
  const [createdFilter, setCreatedFilter] = useState('');
  const [salesFilter, setSalesFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [newCategory, setNewCategory] = useState('');
  const [showBackgroundPreview, setShowBackgroundPreview] = useState(true);
  const [homeMedia, setHomeMedia] = useState(defaultHomeMedia);

  useEffect(() => {
    setHomeMedia(getHomeMedia());
    fetchDashboard();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

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
    <section className="panel-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Dashboard</h2>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Products</span>
          <strong>{stats.products || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Total Users</span>
          <strong>{stats.users || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Total Orders</span>
          <strong>{stats.orders || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Revenue</span>
          <strong>${Number(stats.revenue || 0).toFixed(2)}</strong>
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
              <th>Sold</th>
              <th>Revenue</th>
              <th>Stock</th>
              <th>Created</th>
              <th>Categories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8">Loading...</td>
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
                  <td>{product.sold_quantity || 0}</td>
                  <td>${Number(product.revenue || 0).toFixed(2)}</td>
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
                <td colSpan="8">No products found.</td>
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
              <th>ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer_name || order.user_name || 'Guest'}</td>
                <td>{order.status}</td>
                <td>${Number(order.total || order.total_price || 0).toFixed(2)}</td>
                <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                <td>{order.payment_method || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderUsers = () => (
    <section className="panel-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Accounts</p>
          <h2>Users</h2>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.roles}</td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
              <span>Giá</span>
              <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} />
            </label>
            <label>
              <span>Tổng số lượng</span>
              <input type="number" value={totalStockFromSizes} readOnly />
            </label>
            <div className="full">
              <span>Size</span>
              <div className="chip-grid">
                {sizeOptions.map((size) => (
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
      </main>
    </div>
  );
}
