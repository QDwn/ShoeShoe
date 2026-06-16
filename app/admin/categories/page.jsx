'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../src/components/Navbar';
import '../admin.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

function normalizeUserRoles(user) {
  const rawRoles = Array.isArray(user?.roles)
    ? user.roles
    : String(user?.roles || user?.role || '')
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean);

  return rawRoles
    .map((role) => {
      if (typeof role === 'string') return role.trim().toLowerCase();
      if (role && typeof role === 'object') return String(role.name || role.role || role.label || '').trim().toLowerCase();
      return '';
    })
    .filter(Boolean);
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  const apiFetch = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
    return data;
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/categories');
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.replace('/login');
        return;
      }

      const user = JSON.parse(storedUser);
      if (!normalizeUserRoles(user).includes('admin')) {
        router.replace('/');
        return;
      }

      setAccessChecked(true);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!accessChecked) return;
    loadCategories();
  }, [accessChecked]);

  const openCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    setShowModal(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category?.name || '');
    setShowModal(true);
  };

  const saveCategory = async () => {
    try {
      const payload = { name: categoryName.trim() };
      if (!payload.name) {
        setError('Category name is required');
        return;
      }

      const method = editingCategory ? 'PUT' : 'POST';
      const path = editingCategory ? `/admin/categories/${editingCategory.id}` : '/admin/categories';
      await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setShowModal(false);
      setEditingCategory(null);
      setCategoryName('');
      loadCategories();
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteCategory = async (category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await apiFetch(`/admin/categories/${category.id}`, { method: 'DELETE' });
      loadCategories();
    } catch (e) {
      setError(e.message);
    }
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
          ['background', 'Edit Background', '/admin/background'],
          ['dashboard', 'Dashboard', '/admin/dashboard'],
          ['products', 'Products', '/admin/products'],
          ['categories', 'Categories', '/admin/categories'],
          ['vouchers', 'Vouchers', '/admin/vouchers'],
          ['orders', 'Orders', '/admin/orders'],
          ['users', 'Users', '/admin/users'],
        ].map(([key, label, href]) => (
          <button
            key={key}
            className={`menu-item ${key === 'categories' ? 'active' : ''}`}
            onClick={() => router.push(href)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );

  if (!accessChecked) {
    return (
      <div className="admin-page">
        <Navbar />
        <div className="admin-access-loading">Checking admin access...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar />
      <div className="admin-shell">
        {renderSidebar()}
        <main className="admin-main">
          <header className="topbar">
            <div>
              <p className="eyebrow">ShoeShoe Admin</p>
              <h1>Categories</h1>
            </div>
            <button type="button" className="btn-primary" onClick={openCreate}>
              + Add Category
            </button>
          </header>

          {error && <div className="error-banner">{error}</div>}

          <section className="panel-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Catalog</p>
                <h2>Manage Categories</h2>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Products</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5">Loading...</td>
                    </tr>
                  ) : categories.length ? (
                    categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.id}</td>
                        <td><strong>{category.name}</strong></td>
                        <td>{category.product_count || 0}</td>
                        <td>{category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="row-actions">
                            <button type="button" className="btn-secondary" onClick={() => openEdit(category)}>Edit</button>
                            <button type="button" className="btn-danger" onClick={() => deleteCategory(category)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No categories found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <p className="eyebrow">Categories</p>
                    <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                  </div>
                  <button type="button" className="icon-button" onClick={() => setShowModal(false)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="form-grid">
                    <label className="full">
                      <span>Name</span>
                      <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category name" />
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="button" className="btn-primary" onClick={saveCategory}>Save</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
