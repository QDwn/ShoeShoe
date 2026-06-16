'use client';

import { useEffect, useMemo, useState } from 'react';
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
      if (role && typeof role === 'object') {
        return String(role.name || role.role || role.label || '').trim().toLowerCase();
      }
      return '';
    })
    .filter(Boolean);
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSort, setUserSort] = useState('new');
  const [showUserFilters, setShowUserFilters] = useState(false);
  const [showUserMenuId, setShowUserMenuId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', roles: 'user' });

  const apiFetch = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
    return data;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/users?limit=200');
      setUsers(Array.isArray(data.users) ? data.users : []);
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
      setRoles([]);
      setError(e.message);
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
    fetchUsers();
    fetchRoles();
  }, [accessChecked]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.user-menu-wrap')) {
        setShowUserMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    return [...users]
      .filter((user) => {
        const name = String(user.name || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();
        const rolesText = String(user.roles || 'user').toLowerCase();
        const matchesSearch = !term || name.includes(term) || email.includes(term);
        const matchesRole = userRoleFilter === 'all' || rolesText.includes(userRoleFilter.toLowerCase());
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
    const fromDb = roles
      .map((role) => String(role.name || '').trim().toLowerCase())
      .filter((role) => ['admin', 'user'].includes(role));

    return Array.from(new Set([...fromDb, 'admin', 'user']));
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
            className={`menu-item ${key === 'users' ? 'active' : ''}`}
            onClick={() => router.push(href)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
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
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSaveUser}>Save</button>
        </div>
      </div>
    </div>
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
              <h1>Users</h1>
            </div>
          </header>

          {error && <div className="error-banner">{error}</div>}

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
              {loading ? (
                <div className="empty-state">Loading users...</div>
              ) : filteredUsers.length ? filteredUsers.map((user) => {
                const initial = String(user.name || user.email || 'U').trim().charAt(0).toUpperCase();
                const joined = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
                const menuOpen = showUserMenuId === user.id;
                const avatarSrc = user.avatar || '';
                const hasAvatar = Boolean(avatarSrc);

                return (
                  <article className="user-card" key={user.id}>
                    <div className="user-card-top">
                      <div className="user-avatar">
                        {hasAvatar ? (
                          <img src={avatarSrc} alt={user.name || 'User avatar'} />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
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
                        <div>
                          <span>Department</span>
                          <strong>{String(user.roles || 'user').split(',')[0] || 'User'}</strong>
                        </div>
                        <div>
                          <span>Joined</span>
                          <strong>{joined}</strong>
                        </div>
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

          {showUserModal && renderUserModal()}
        </main>
      </div>
    </div>
  );
}
