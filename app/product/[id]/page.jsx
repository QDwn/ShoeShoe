'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import '../../products/products.css';
import './product.css';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (response.ok && data.product) {
        setProduct(data.product);
      } else {
        setError(data.message || 'Product not found');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // Placeholder for cart functionality
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return <div className="product-loading">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="product-error">
        <p>{error || 'Product not found'}</p>
        <Link href="/products" className="back-to-products">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-header">
        <Link href="/products" className="back-link">← Back to Products</Link>
      </div>

      <div className="product-detail-wrapper">
        {/* Image Section */}
        <div className="product-detail-image">
          <img src={product.image_url} alt={product.name} />
          {product.stock_quantity === 0 && (
            <div className="stock-overlay">Out of Stock</div>
          )}
        </div>

        {/* Info Section */}
        <div className="product-detail-info">
          <div className="detail-categories">
            {product.categories && Array.isArray(product.categories) && product.categories.map((cat, index) => (
              <span key={index} className="detail-category">{cat}</span>
            ))}
          </div>
          <h1>{product.name}</h1>

          <div className="detail-price">
            ${parseFloat(product.price).toFixed(2)}
          </div>

          <div className="detail-stock">
            {product.stock_quantity > 0 ? (
              <>
                <span className="in-stock">✓ In Stock</span>
                <span className="stock-quantity">({product.stock_quantity} available)</span>
              </>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </div>

          <div className="detail-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="detail-purchase">
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-control">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stock_quantity === 0}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={product.stock_quantity}
                  disabled={product.stock_quantity === 0}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={product.stock_quantity === 0}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="add-to-cart-large"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
            >
              {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>

            <button className="buy-now" disabled={product.stock_quantity === 0}>
              Buy Now
            </button>
          </div>

          <div className="detail-shipping">
            <div className="shipping-item">
              <span className="icon">📦</span>
              <div>
                <h4>Free Shipping</h4>
                <p>On orders over $50</p>
              </div>
            </div>
            <div className="shipping-item">
              <span className="icon">↩️</span>
              <div>
                <h4>Easy Returns</h4>
                <p>30-day return policy</p>
              </div>
            </div>
            <div className="shipping-item">
              <span className="icon">🛡️</span>
              <div>
                <h4>Secure Checkout</h4>
                <p>100% secure payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="related-products">
        <h3>You Might Also Like</h3>
        <div className="related-grid">
          {/* Placeholder for related products */}
          <p>More products coming soon...</p>
        </div>
      </div>
    </div>
  );
}
