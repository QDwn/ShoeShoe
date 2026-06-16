'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import './admin.css';

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
      if (role && typeof role === 'object') {
        return String(role.name || role.role || role.label || '').trim().toLowerCase();
      }
      return '';
    })
    .filter(Boolean);
}

function AdminSidebar({ activeTab, router }) {
  const items = [
    ['background', 'Edit Background', '/admin/background'],
    ['dashboard', 'Dashboard', '/admin/dashboard'],
    ['products', 'Products', '/admin/products'],
    ['categories', 'Categories', '/admin/categories'],
    ['vouchers', 'Vouchers', '/admin/vouchers'],
    ['orders', 'Orders', '/admin/orders'],
    ['reviews', 'Reviews', '/admin/reviews'],
    ['users', 'Users', '/admin/users'],
  ];

  return (
    <aside className="admin-sidebar">
      <div className="brand-card">
        <div className="brand-logo">SS</div>
        <div>
          <div className="brand-name">ShoeShoe</div>
          <div className="brand-sub">Admin Console</div>
        </div>
      </div>

      <nav className="admin-menu">
        {items.map(([key, label, href]) => (
          <button
            key={key}
            className={`menu-item ${activeTab === key ? 'active' : ''}`}
            onClick={() => router.push(href)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default function AdminPageFrame({ activeTab, title, eyebrow = 'ShoeShoe Admin', error, children }) {
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);

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
        <AdminSidebar activeTab={activeTab} router={router} />
        <main className="admin-main">
          <header className="topbar">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}

export { normalizeUserRoles, AdminSidebar };
