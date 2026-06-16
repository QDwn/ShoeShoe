'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageFrame from '../AdminPageFrame';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

export default function AdminReviewsPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const apiFetch = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
    return data;
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (search.trim()) params.set('search', search.trim());
      if (ratingFilter) params.set('rating', ratingFilter);

      const data = await apiFetch(`/admin/reviews?${params.toString()}`);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadReviews();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, ratingFilter]);

  const filteredReviews = useMemo(() => reviews, [reviews]);

  const openEdit = (review) => {
    setEditingReview(review);
    setReviewForm({
      rating: Number(review.rating || 5),
      comment: review.comment || '',
    });
    setShowModal(true);
  };

  const saveReview = async () => {
    try {
      const data = await apiFetch(`/admin/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: Number(reviewForm.rating || 0),
          comment: reviewForm.comment,
        }),
      });

      setReviews((prev) => prev.map((item) => (item.id === editingReview.id ? { ...item, ...data.review } : item)));
      setShowModal(false);
      setEditingReview(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteReview = async (review) => {
    if (!confirm(`Delete review #${review.id}?`)) return;
    try {
      await apiFetch(`/admin/reviews/${review.id}`, { method: 'DELETE' });
      setReviews((prev) => prev.filter((item) => item.id !== review.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const renderStars = (value) => '★★★★★'.split('').map((star, index) => (
    <span key={index} style={{ color: index < value ? '#f5a524' : '#d0d5dd' }}>★</span>
  ));

  const reviewDetailUrl = (review) => `/product/${review.product_id}#review-${review.id}`;

  return (
    <AdminPageFrame activeTab="reviews" title="Reviews" error={error}>
      <section className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Moderation</p>
            <h2>Manage Reviews</h2>
          </div>
        </div>

        <div className="toolbar-grid">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product, user or comment" />
          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">Loading reviews...</td>
                </tr>
              ) : filteredReviews.length ? (
                filteredReviews.map((review) => (
                  <tr key={review.id}>
                    <td>#{review.id}</td>
                    <td>
                      <div className="product-cell">
                        {review.product_image ? <img src={review.product_image} alt={review.product_name} /> : <div className="thumb-fallback" />}
                        <div>
                          <strong
                            title={review.product_name || 'Product'}
                            style={{
                              display: 'inline-block',
                              maxWidth: 180,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              verticalAlign: 'bottom',
                            }}
                          >
                            {review.product_name || 'Product'}
                          </strong>
                          <span>ID: {review.product_id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{review.user_name || 'User'}</strong>
                      <div className="review-subtext">{review.user_email || '-'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <strong>{review.rating}/5</strong>
                        <div>{renderStars(Number(review.rating || 0))}</div>
                      </div>
                    </td>
                    <td className="review-comment-cell">{review.comment || '-'}</td>
                    <td>{review.created_at ? new Date(review.created_at).toLocaleString() : '-'}</td>
                    <td>{review.updated_at ? new Date(review.updated_at).toLocaleString() : '-'}</td>
                    <td>{review.order_status || '-'}</td>
                    <td>
                      <div className="row-actions">
                        <a
                          href={reviewDetailUrl(review)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                          title={`Open product and review: ${review.product_name || 'Product'}`}
                        >
                          Detail
                        </a>
                        <button type="button" className="btn-secondary" onClick={() => openEdit(review)}>Edit</button>
                        <button type="button" className="btn-danger" onClick={() => deleteReview(review)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No reviews found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && editingReview && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Reviews</p>
                <h3>Edit Review</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  <span>Rating</span>
                  <select value={reviewForm.rating} onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} star(s)</option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  <span>Comment</span>
                  <textarea
                    rows="5"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={saveReview}>Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageFrame>
  );
}
