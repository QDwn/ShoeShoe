'use client';

import { useState, useEffect } from 'react';
import './admin.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [homeBackground, setHomeBackground] = useState('');
  const [homeBackgroundDraft, setHomeBackgroundDraft] = useState('');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    categories: [],
    image_url: '',
    stock_quantity: ''
  });

  // Role management states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    fetchDashboard();
    fetchCategories();
    const savedBackground = localStorage.getItem('home_background_image') || '';
    setHomeBackground(savedBackground);
    setHomeBackgroundDraft(savedBackground);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // ==================== API CALLS ====================

  const fetchDashboard = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/stats/dashboard');
      const data = await res.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/products?limit=100');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/orders?limit=100');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/users?limit=100');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/admin/roles');
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleOpenRoleModal = async (user) => {
    setEditingUser(user);
    // Parse roles from user.roles string (e.g., "admin, user")
    const userRolesList = user.roles ? user.roles.split(', ') : [];
    setUserRoles(userRolesList);
    await fetchRoles();
    setShowRoleModal(true);
  };

  const handleAssignRole = async (roleId) => {
    if (!editingUser) return;

    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${editingUser.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId })
      });

      if (res.ok) {
        // Refresh users list
        fetchUsers();
        // Update editing user's roles
        const role = roles.find(r => r.id === roleId);
        if (role && !userRoles.includes(role.name)) {
          setUserRoles([...userRoles, role.name]);
        }
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (!editingUser) return;

    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${editingUser.id}/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Refresh users list
        fetchUsers();
        // Update editing user's roles
        const role = roles.find(r => r.id === roleId);
        if (role) {
          setUserRoles(userRoles.filter(r => r !== role.name));
        }
      }
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct 
        ? `http://localhost:3001/api/admin/products/${editingProduct.id}`
        : 'http://localhost:3001/api/admin/products';
      // Ensure we send `categories` as an array to the backend
      const payload = { ...productForm };
      if (!Array.isArray(payload.categories) && payload.category) {
        payload.categories = [payload.category];
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingProduct ? 'Product updated!' : 'Product added!');
        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({
          name: '',
          description: '',
          price: '',
          category: 'Lifestyle',
          image_url: '',
          stock_quantity: ''
        });
        fetchProducts();
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/admin/products/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('Product deleted!');
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/admin/orders/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('Order deleted!');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('User deleted!');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:3001/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const openEditProduct = (product) => {
    const productCategories = typeof product.category === 'string'
      ? product.category.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      categories: productCategories,
      image_url: product.image_url || '',
      stock_quantity: product.stock_quantity || ''
    });
    setShowProductModal(true);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProductForm(prev => ({
        ...prev,
        image_url: reader.result || ''
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleHomeBackgroundSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const nextValue = reader.result || '';
      setHomeBackgroundDraft(nextValue);
      setHomeBackground(nextValue);
      localStorage.setItem('home_background_image', nextValue);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveHomeBackground = () => {
    const nextValue = homeBackgroundDraft.trim();
    setHomeBackground(nextValue);
    localStorage.setItem('home_background_image', nextValue);
  };

  const handleRemoveHomeBackground = () => {
    setHomeBackground('');
    setHomeBackgroundDraft('');
    localStorage.removeItem('home_background_image');
  };

  // ==================== RENDER SECTIONS ====================

  const renderDashboard = () => (
    <div className="admin-content">
      <h2>Dashboard</h2>
      <div className="home-hero-card">
        <div className="home-hero-card-header">
          <div>
            <h3>Home Background</h3>
            <p className="muted">Hover vào ảnh để đổi hoặc xóa hình nền trang home.</p>
          </div>
        </div>

        <div className="home-hero-preview-shell">
          {homeBackground ? (
            <div className="home-hero-preview">
              <img src={homeBackground} alt="Home background preview" />
              <div className="home-hero-overlay">
                <label className="home-hero-action" title="Change image">
                  <span className="home-hero-action-icon">✎</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHomeBackgroundSelect}
                  />
                </label>
                <button
                  type="button"
                  className="home-hero-action danger"
                  onClick={handleRemoveHomeBackground}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <label className="home-hero-empty">
              <span className="home-hero-empty-icon">✎</span>
              <span>Upload background image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleHomeBackgroundSelect}
              />
            </label>
          )}
        </div>

        <div className="home-hero-url-row">
          <input
            type="text"
            value={homeBackgroundDraft}
            onChange={(e) => setHomeBackgroundDraft(e.target.value)}
            placeholder="Or paste image URL here"
          />
          <button className="btn-primary" type="button" onClick={handleSaveHomeBackground}>
            Save
          </button>
          <button className="btn-secondary" type="button" onClick={handleRemoveHomeBackground}>
            Remove
          </button>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.products || 0}</div>
          <div className="stat-label">Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.users || 0}</div>
          <div className="stat-label">Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.orders || 0}</div>
          <div className="stat-label">Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${parseFloat(stats.revenue || 0).toFixed(2)}</div>
          <div className="stat-label">Revenue</div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="admin-content">
      <div className="admin-header">
        <h2>Products Management</h2>
        <button className="btn-primary" onClick={() => {
          setEditingProduct(null);
          setProductForm({
            name: '',
            description: '',
            price: '',
            categories: categories.length > 0 ? [categories[0]] : [],
            image_url: '',
            stock_quantity: ''
          });
          setShowProductModal(true);
        }}>
          + Add New Product
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>${parseFloat(product.price).toFixed(2)}</td>
                  <td>{product.category}</td>
                  <td>{product.stock_quantity}</td>
                  <td>
                    <button 
                      className="btn-edit"
                      onClick={() => openEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <div className="form-group">
              <label>Product Name</label>
              <input 
                type="text"
                value={productForm.name}
                onChange={e => setProductForm({...productForm, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={productForm.description}
                onChange={e => setProductForm({...productForm, description: e.target.value})}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price</label>
                <input 
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={e => setProductForm({...productForm, price: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Categories</label>
                <select 
                  multiple
                  value={productForm.categories}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                    setProductForm({...productForm, categories: selected});
                  }}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <small className="muted">Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Image URL</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                <input 
                  type="text"
                  value={productForm.image_url}
                  onChange={e => setProductForm({...productForm, image_url: e.target.value})}
                  placeholder="Or paste image URL"
                />
                {productForm.image_url && (
                  <div className="image-preview-wrap">
                    <img src={productForm.image_url} alt="Preview" className="image-preview" />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input 
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={e => setProductForm({...productForm, stock_quantity: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveProduct}>Save</button>
              <button className="btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="admin-content">
      <h2>Orders Management</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.user_name || 'Guest'}</td>
                  <td>
                    <div>{order.payment_method || 'cash'}</div>
                    <small className="muted">{order.payment_status || 'paid'}</small>
                  </td>
                  <td>
                    <select 
                      value={order.status || 'paid'}
                      onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="paid">Paid</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>${parseFloat(order.total || order.total_price || 0).toFixed(2)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="admin-content">
      <h2>Users Management</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className="badge">{user.roles}</span></td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-edit"
                      onClick={() => handleOpenRoleModal(user)}
                    >
                      Roles
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRoleModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Manage Roles for {editingUser.name}</h3>
            <p className="modal-info">Email: {editingUser.email}</p>

            <div className="form-group">
              <label>Current Roles:</label>
              <div className="current-roles">
                {userRoles.length > 0 ? (
                  userRoles.map(roleName => (
                    <span key={roleName} className="role-tag">
                      {roleName}
                    </span>
                  ))
                ) : (
                  <span className="no-roles">No roles assigned</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Assign New Role:</label>
              <div className="roles-list">
                {roles.map(role => {
                  const isAssigned = userRoles.includes(role.name);
                  return (
                    <div key={role.id} className="role-item">
                      <span className="role-name">
                        <strong>{role.name}</strong>
                        {role.description && <p className="role-desc">{role.description}</p>}
                      </span>
                      {isAssigned ? (
                        <button
                          className="btn-delete"
                          onClick={() => handleRemoveRole(role.id)}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => handleAssignRole(role.id)}
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRoleModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h1>Admin Panel</h1>
        </div>
        <nav className="admin-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            🛒 Orders
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
        </nav>
      </div>

      <div className="admin-main">
        <div className="admin-topbar">
          <h1>ShoeShoe Admin Dashboard</h1>
        </div>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'users' && renderUsers()}
      </div>
    </div>
  );
}
