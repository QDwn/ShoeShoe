'use client';

import { useEffect, useState } from 'react';
import AdminPageFrame from '../AdminPageFrame';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

const initialVoucherForm = {
  code: '',
  discount_percent: '',
  description: '',
  max_uses: '',
  starts_at: '',
  ends_at: '',
  active: true,
};

export default function AdminVouchersPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherForm, setVoucherForm] = useState(initialVoucherForm);

  const apiFetch = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
    return data;
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/coupons');
      setVouchers(data.coupons || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const openVoucherModal = (voucher = null) => {
    setEditingVoucher(voucher);
    setVoucherForm(voucher ? {
      code: voucher.code || '',
      discount_percent: String(voucher.discount_percent ?? ''),
      description: voucher.description || '',
      max_uses: voucher.max_uses === null || voucher.max_uses === undefined ? '' : String(voucher.max_uses),
      starts_at: voucher.starts_at ? new Date(voucher.starts_at).toISOString().slice(0, 16) : '',
      ends_at: voucher.ends_at ? new Date(voucher.ends_at).toISOString().slice(0, 16) : '',
      active: voucher.active !== false,
    } : initialVoucherForm);
    setShowVoucherModal(true);
  };

  const handleSaveVoucher = async () => {
    try {
      const payload = {
        code: voucherForm.code,
        discount_percent: Number(voucherForm.discount_percent || 0),
        description: voucherForm.description,
        max_uses: voucherForm.max_uses === '' ? null : Number(voucherForm.max_uses),
        starts_at: voucherForm.starts_at || null,
        ends_at: voucherForm.ends_at || null,
        active: voucherForm.active,
      };

      const path = editingVoucher ? `/coupons/${editingVoucher.id}` : '/coupons';
      const method = editingVoucher ? 'PUT' : 'POST';
      await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setShowVoucherModal(false);
      setEditingVoucher(null);
      setVoucherForm(initialVoucherForm);
      fetchVouchers();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteVoucher = async (voucherId) => {
    if (!confirm('Bạn chắc chắn muốn xóa voucher này?')) return;
    try {
      await apiFetch(`/coupons/${voucherId}`, { method: 'DELETE' });
      setVouchers((prev) => prev.filter((voucher) => voucher.id !== voucherId));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <AdminPageFrame activeTab="vouchers" title="Vouchers" error={error}>
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Promotions</p>
            <h2>Vouchers</h2>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingVoucher(null);
              setVoucherForm(initialVoucherForm);
              setShowVoucherModal(true);
            }}
          >
            + Add Voucher
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Description</th>
                <th>Used</th>
                <th>Limit</th>
                <th>Remaining</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10">Loading vouchers...</td>
                </tr>
              ) : vouchers.length ? vouchers.map((voucher) => {
                const voucherStatus = voucher.computed_status || (voucher.active ? 'active' : 'inactive');
                const voucherStatusClass = voucherStatus === 'active'
                  ? 'status-delivered'
                  : voucherStatus === 'scheduled'
                    ? 'status-processing'
                    : 'status-cancelled';
                const voucherStatusLabel = voucherStatus === 'active'
                  ? 'Active'
                  : voucherStatus === 'scheduled'
                    ? 'Scheduled'
                    : 'Inactive';

                return (
                  <tr key={voucher.id}>
                    <td><strong>{voucher.code}</strong></td>
                    <td>{voucher.discount_percent}%</td>
                    <td>{voucher.description || '-'}</td>
                    <td>{voucher.use_count || 0}</td>
                    <td>{voucher.max_uses ?? 'Unlimited'}</td>
                    <td>{voucher.remaining_uses ?? 'Unlimited'}</td>
                    <td>{voucher.starts_at ? new Date(voucher.starts_at).toLocaleString() : '-'}</td>
                    <td>{voucher.ends_at ? new Date(voucher.ends_at).toLocaleString() : '-'}</td>
                    <td>
                      <span className={`status-pill ${voucherStatusClass}`}>
                        {voucherStatusLabel}
                      </span>
                    </td>
                    <td>
                      <div className="action-stack">
                        <button type="button" className="btn-secondary" onClick={() => openVoucherModal(voucher)}>Edit</button>
                        <button type="button" className="btn-danger" onClick={() => handleDeleteVoucher(voucher.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="10">No vouchers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showVoucherModal && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-card user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Vouchers</p>
                <h3>{editingVoucher ? 'Edit Voucher' : 'Add Voucher'}</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowVoucherModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  <span>Code</span>
                  <input value={voucherForm.code} onChange={(e) => setVoucherForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} />
                </label>
                <label>
                  <span>Discount (%)</span>
                  <input type="number" min="1" max="100" value={voucherForm.discount_percent} onChange={(e) => setVoucherForm((prev) => ({ ...prev, discount_percent: e.target.value }))} />
                </label>
                <label className="full">
                  <span>Description</span>
                  <input value={voucherForm.description} onChange={(e) => setVoucherForm((prev) => ({ ...prev, description: e.target.value }))} />
                </label>
                <label>
                  <span>Max uses</span>
                  <input type="number" min="1" value={voucherForm.max_uses} onChange={(e) => setVoucherForm((prev) => ({ ...prev, max_uses: e.target.value }))} placeholder="Unlimited" />
                </label>
                <label>
                  <span>Status</span>
                  <select value={voucherForm.active ? 'active' : 'inactive'} onChange={(e) => setVoucherForm((prev) => ({ ...prev, active: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  <span>Starts at</span>
                  <input type="datetime-local" value={voucherForm.starts_at} onChange={(e) => setVoucherForm((prev) => ({ ...prev, starts_at: e.target.value }))} />
                </label>
                <label>
                  <span>Ends at</span>
                  <input type="datetime-local" value={voucherForm.ends_at} onChange={(e) => setVoucherForm((prev) => ({ ...prev, ends_at: e.target.value }))} />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowVoucherModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSaveVoucher}>Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageFrame>
  );
}
