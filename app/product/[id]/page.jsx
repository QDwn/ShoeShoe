'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../src/components/Navbar';
import { useCart } from '../../../src/context/CartContext';
import '../../products/products.css';
import './product.css';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeOptions, setSizeOptions] = useState([]);
  const [sizeStocks, setSizeStocks] = useState({});
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const panelRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(420); // px
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  const productText = `${product?.name || ''} ${(product?.categories || []).join(' ')}`.toLowerCase();
  const sizeOptionsLookLikeShirt = sizeOptions.some((size) => /^(xs|s|m|l|xl|xxl|2xl|3xl)$/i.test(String(size).trim())) || sizeOptions.some((size) => /y$/i.test(String(size).trim()));
  const sizeOptionsLookLikeShoe = sizeOptions.some((size) => /^\d+(?:\.\d+)?$/.test(String(size).trim()));
  const isShirtProduct = sizeOptionsLookLikeShirt
    ? true
    : sizeOptionsLookLikeShoe
      ? false
      : /shirt|jersey|tee|apparel/i.test(productText);
  const isShoeProduct = sizeOptionsLookLikeShoe
    ? true
    : sizeOptionsLookLikeShirt
      ? false
      : /shoe|sneaker|boot|running|football/i.test(productText);
  const sizeGuideLabel = isShirtProduct
    ? 'Jersey size guide'
    : isShoeProduct
      ? 'Shoe size guide'
      : 'Size guide';

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    // fetch sizes from backend; if present, use them
    (async () => {
      try {
        const res = await fetch(`/api/products/${product.id}/sizes`);
        if (res.ok) {
          const body = await res.json();
          if (body.sizes && body.sizes.length > 0) {
            setSizeOptions(body.sizes.map(s => s.size));
            const map = {};
            body.sizes.forEach(s => { map[s.size] = s.stock; });
            setSizeStocks(map);
            return;
          }
        }
      } catch (err) {
        console.error('Size fetch error', err);
      }

      // fallback to heuristic if backend has no sizes
      const fallback = (function(){
        const cats = (product.categories || []).map(c => c.toLowerCase());
        const name = (product.name || '').toLowerCase();

        const isShoe = cats.some(c => c.includes('shoe') || c.includes('sneaker')) || name.includes('shoe') || name.includes('sneaker');
        const isShirt = cats.some(c => c.includes('shirt') || c.includes('jersey') || c.includes('tee') || c.includes('apparel')) || name.includes('shirt') || name.includes('jersey') || name.includes('tee');

        if (isShoe) return Array.from({length: 45-30+1}).map((_,i)=>(30+i).toString());
        if (isShirt) return ['XS','S','M','L','XL','XXL'];
        return [];
      })();
      setSizeOptions(fallback);
      setSizeStocks({});
    })();
  }, [product]);

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

  // Resizer logic for left-edge drag
  function startResize(e) {
    if (!panelRef.current) return;
    const startX = e.clientX;
    const startWidth = panelRef.current.getBoundingClientRect().width;
    const minWidth = 320;
    const maxWidth = Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.5);

    function onMove(ev) {
      const clientX = ev.clientX !== undefined ? ev.clientX : (ev.touches && ev.touches[0] && ev.touches[0].clientX) || startX;
      // dragging left should increase width: delta = startX - clientX
      const delta = startX - clientX;
      let newWidth = Math.round(startWidth + delta);
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;
      setPanelWidth(newWidth);
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }

  const handleAddToCart = () => {
    // Add to cart using CartContext
    try {
      const priceNum = parseFloat(product.price) || 0;
      const item = { id: product.id, name: product.name, price: priceNum, image_url: product.image_url || '/default-product.jpg' };
      if (selectedSize) item.size = selectedSize;
      addItem(item, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Add to cart failed', err);
    }
  };

  const renderShoeSizeGuide = () => (
    <>
      <h2>SIZE GUIDE</h2>
      <p className="guide-intro">Men's and women's footwear sizing — scroll to see full table.</p>
      <div className="guide-table-wrap">
        <div className="guide-table-scroll">
          <table className="guide-table">
            <thead>
              <tr>
                <th></th>
                <th>3.5 / 22.5</th>
                <th>4 / 23</th>
                <th>4.5 / 23.5</th>
                <th>5 / 23.5</th>
                <th>5.5 / 24</th>
                <th>6 / 24</th>
                <th>6.5 / 24.5</th>
                <th>7 / 25</th>
                <th>7.5 / 25.5</th>
                <th>8 / 26</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>US - Men</td>
                <td>3.5</td>
                <td>4</td>
                <td>4.5</td>
                <td>5</td>
                <td>5.5</td>
                <td>6</td>
                <td>6.5</td>
                <td>7</td>
                <td>7.5</td>
                <td>8</td>
              </tr>
              <tr>
                <td>US - Women</td>
                <td>5</td>
                <td>5.5</td>
                <td>6</td>
                <td>6.5</td>
                <td>7</td>
                <td>7.5</td>
                <td>8</td>
                <td>8.5</td>
                <td>9</td>
                <td>9.5</td>
              </tr>
              <tr>
                <td>US - Kids</td>
                <td>3.5Y</td>
                <td>4Y</td>
                <td>4.5Y</td>
                <td>5Y</td>
                <td>5.5Y</td>
                <td>6Y</td>
                <td>6.5Y</td>
                <td>7Y</td>
                <td>7.5Y</td>
                <td>8Y</td>
              </tr>
              <tr>
                <td>UK</td>
                <td>3</td>
                <td>3.5</td>
                <td>4</td>
                <td>4.5</td>
                <td>5</td>
                <td>5.5</td>
                <td>6</td>
                <td>6.5</td>
                <td>7</td>
                <td>7.5</td>
              </tr>
              <tr>
                <td>CM / JP</td>
                <td>22.5</td>
                <td>23</td>
                <td>23.5</td>
                <td>23.5</td>
                <td>24</td>
                <td>24</td>
                <td>24.5</td>
                <td>25</td>
                <td>25.5</td>
                <td>26</td>
              </tr>
              <tr>
                <td>EU</td>
                <td>35.5</td>
                <td>36</td>
                <td>36.5</td>
                <td>37.5</td>
                <td>38</td>
                <td>38.5</td>
                <td>39</td>
                <td>40</td>
                <td>40.5</td>
                <td>41</td>
              </tr>
              <tr>
                <td>Foot Length (cm)</td>
                <td>21.6</td>
                <td>22</td>
                <td>22.4</td>
                <td>22.9</td>
                <td>23.3</td>
                <td>23.7</td>
                <td>24.1</td>
                <td>24.6</td>
                <td>25</td>
                <td>25.4</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="guide-footer">
        <h4>In between sizes?</h4>
        <p>For tight fit, go one size down. For a loose fit, go one size up.</p>
      </div>
    </>
  );

  const renderShirtSizeGuide = () => (
    <>
      <h2>Size Chart</h2>
      <p className="guide-intro">Men's Basketball jersey size reference chart.</p>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Height</th>
              <th>Weight</th>
              <th>Chest Width</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S</td>
              <td>1m55 - 1m65</td>
              <td>45 - 55 kg</td>
              <td>46 - 48 cm</td>
            </tr>
            <tr>
              <td>M</td>
              <td>1m65 - 1m72</td>
              <td>55 - 65 kg</td>
              <td>49 - 51 cm</td>
            </tr>
            <tr>
              <td>L</td>
              <td>1m70 - 1m78</td>
              <td>65 - 75 kg</td>
              <td>52 - 54 cm</td>
            </tr>
            <tr>
              <td>XL</td>
              <td>1m75 - 1m83</td>
              <td>75 - 85 kg</td>
              <td>55 - 57 cm</td>
            </tr>
            <tr>
              <td>XXL</td>
              <td>1m80 - 1m90</td>
              <td>85 - 95 kg</td>
              <td>58 - 60 cm</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Women's Basketball Jersey Size Chart</h2>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Height</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S</td>
              <td>1m50 - 1m58</td>
              <td>40 - 48 kg</td>
            </tr>
            <tr>
              <td>M</td>
              <td>1m55 - 1m63</td>
              <td>48 - 55 kg</td>
            </tr>
            <tr>
              <td>L</td>
              <td>1m60 - 1m68</td>
              <td>55 - 62 kg</td>
            </tr>
            <tr>
              <td>XL</td>
              <td>1m65 - 1m72</td>
              <td>62 - 70 kg</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );

  // sizeOptions and sizeStocks filled by effect above

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
    <>
    <div className="product-detail-container">
      <Navbar />
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
                  max={selectedSize && sizeStocks[selectedSize] !== undefined ? sizeStocks[selectedSize] : product.stock_quantity}
                  disabled={(selectedSize && sizeStocks[selectedSize] === 0) || product.stock_quantity === 0}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={product.stock_quantity === 0}
                >
                  +
                </button>
              </div>
            </div>

            {sizeOptions.length > 0 && (
              <div className="quantity-selector size-selector">
                <label>Sizes:</label>
                <div className="size-grid">
                  {sizeOptions.map(s => {
                    const stock = sizeStocks[s] === undefined ? null : sizeStocks[s];
                    const disabled = stock !== null && stock <= 0;
                    return (
                      <button
                        key={s}
                        className={`size-button ${selectedSize === s ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={() => !disabled && setSelectedSize(s)}
                        disabled={disabled}
                        aria-pressed={selectedSize === s}
                      >
                        <span className="size-label">{s}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="size-meta">
                  <div className="size-status">
                    {selectedSize ? (
                      sizeStocks[selectedSize] !== undefined ? (
                        sizeStocks[selectedSize] > 5 ? (
                          <span className="in-stock">{sizeStocks[selectedSize]} available</span>
                        ) : sizeStocks[selectedSize] > 0 ? (
                          <span className="low-stock">Low in stock</span>
                        ) : (
                          <span className="out-of-stock">Out of stock</span>
                        )
                      ) : (
                        <span className="stock-unknown">Stock unknown</span>
                      )
                    ) : (
                      <span className="stock-hint">Select a size to see availability.</span>
                    )}
                  </div>
                  <button className="size-guide-link" onClick={() => setShowSizeGuide(true)}>{sizeGuideLabel}</button>
                </div>
              </div>
            )}

            <button
              className="add-to-cart-large"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || (sizeOptions.length > 0 && !selectedSize)}
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

    {showSizeGuide && (
      <div className="size-guide-modal" role="dialog" aria-modal="true">
        <div
          className={`size-guide-panel ${isShirtProduct ? 'shirt-guide-panel' : ''}`}
          ref={panelRef}
          style={{ width: typeof panelWidth === 'number' ? panelWidth + 'px' : panelWidth }}
        >
          <div
            className="size-resizer"
            onMouseDown={(e) => startResize(e)}
            onTouchStart={(e) => startResize(e.touches[0])}
            aria-hidden="true"
          />
          <button className="close-guide" onClick={() => setShowSizeGuide(false)}>✕</button>
          {isShirtProduct ? renderShirtSizeGuide() : renderShoeSizeGuide()}
        </div>
        <div className="size-guide-backdrop" onClick={() => setShowSizeGuide(false)} />
      </div>
    )}
    </>
  );
}
