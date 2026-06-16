'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageFrame from '../AdminPageFrame';

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
  shoe: { label: 'Giày', sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] },
  shirt: { label: 'Áo', sizes: ['Freesize', 'S', 'M', 'L', 'XL', 'XXL'] },
  socks: { label: 'Tất', sizes: ['Freesize'] },
  ball: { label: 'Bóng', sizes: ['4', '5'] },
};

function inferProductTypeFromSizes(sizes) {
  const normalized = (Array.isArray(sizes) ? sizes : []).map((size) => String(size).trim().toLowerCase());
  if (!normalized.length) return 'shoe';
  if (normalized.every((size) => ['4', '5'].includes(size))) return 'ball';
  if (normalized.length === 1 && normalized[0] === 'freesize') return 'socks';
  if (normalized.some((size) => ['s', 'm', 'l', 'xl', 'xxl'].includes(size)) || normalized.includes('freesize')) return 'shirt';
  return 'shoe';
}

export default function AdminProductsPage() {
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState('new');
  const [createdFilter, setCreatedFilter] = useState('');
  const [salesFilter, setSalesFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(initialProductForm);

  const apiFetch = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
    return data;
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

  const fetchCategories = async () => {
    try {
      const data = await apiFetch('/categories');
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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
        if (!cancelled) setError(e.message);
      }
    };

    loadProductForm();

    return () => {
      cancelled = true;
    };
  }, [showProductModal, editingProduct]);

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

  return (
    <AdminPageFrame activeTab="products" title="Products" error={error}>
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

      {showProductModal && (
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
                      <button
                        key={size}
                        type="button"
                        className={`chip ${productForm.sizes.includes(size) ? 'active' : ''}`}
                        onClick={() => toggleSize(size)}
                      >
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
                    )) : <p className="muted">chọn size để nhập số lượng.</p>}
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
      )}
    </AdminPageFrame>
  );
}
