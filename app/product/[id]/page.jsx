'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../src/components/Navbar';
import BasketballFooter from '../../../src/components/BasketballFooter';
import { useCart } from '../../../src/context/CartContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import './product.css';

const FALLBACK_PRODUCT_IMAGE = '/logo.png';

function getSafeProductImage(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value || value.startsWith('data:image/')) return FALLBACK_PRODUCT_IMAGE;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  return `/${value}`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
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
  const { t } = useLanguage();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

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
    ? t('productDetail.jerseySizeGuide')
    : isShoeProduct
      ? t('productDetail.shoeSizeGuide')
      : t('productDetail.sizeGuide');

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
            const options = body.sizes
              .filter((s) => Number(s.stock) > 0)
              .map((s) => String(s.size).trim())
              .filter(Boolean);
            setSizeOptions(options);
            const map = {};
            body.sizes.forEach(s => {
              if (Number(s.stock) > 0) {
                map[String(s.size).trim()] = Number(s.stock);
              }
            });
            setSizeStocks(map);
            setSelectedSize((current) => (current && map[current] ? current : ''));
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

  useEffect(() => {
    if (!product) return;

    let cancelled = false;
    const maxResults = 8;

    async function fetchRelated() {
      setRelatedLoading(true);
      try {
        const name = (product.name || '').trim();
        const resultsMap = new Map();

        // First try search by full name
        if (name.length > 0) {
          const res = await fetch(`/api/products?search=${encodeURIComponent(name)}&limit=20`);
          if (res.ok) {
            const body = await res.json();
            (body.products || []).forEach(p => {
              if (p.id !== product.id) resultsMap.set(p.id, p);
            });
          }
        }

        // If not enough, try tokenized queries (long tokens only)
        if (resultsMap.size < maxResults) {
          const tokens = (product.name || '').toLowerCase().split(/[^a-z0-9]+/i).filter(t => t && t.length > 3);
          for (const token of tokens) {
            if (resultsMap.size >= maxResults) break;
            try {
              const res = await fetch(`/api/products?search=${encodeURIComponent(token)}&limit=20`);
              if (!res.ok) continue;
              const body = await res.json();
              (body.products || []).forEach(p => {
                if (p.id !== product.id && !resultsMap.has(p.id)) resultsMap.set(p.id, p);
              });
            } catch (e) {
              // ignore
            }
          }
        }

        // Convert to array and score by simple token-overlap similarity
        const candidates = Array.from(resultsMap.values());
        const baseTokens = (product.name || '').toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
        function score(p) {
          const pt = (p.name || '').toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);
          let common = 0;
          for (const bt of baseTokens) if (pt.includes(bt)) common++;
          return common + (p.categories && p.categories.includes((product.categories||[])[0]) ? 0.5 : 0);
        }

        candidates.sort((a, b) => score(b) - score(a));

        if (!cancelled) setRelatedProducts(candidates.slice(0, maxResults));
      } catch (err) {
        console.error('Related fetch error', err);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    }

    fetchRelated();

    return () => { cancelled = true; };
  }, [product]);

  const fetchProduct = async () => {
    if (!productId) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (response.ok && data.product) {
        setProduct(data.product);
      } else {
        setError(data.message || t('productDetail.notFound'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError(t('productDetail.failedToLoad'));
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
      const item = { id: product.id, name: product.name, price: priceNum, image_url: getSafeProductImage(product.image_url) };
      if (selectedSize) item.size = selectedSize;
      addItem(item, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Add to cart failed', err);
    }
  };

  const handleBuyNow = () => {
    try {
      const item = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image_url: getSafeProductImage(product.image_url),
        quantity: quantity,
        size: selectedSize || ''
      };
      try {
        localStorage.removeItem('checkout_state');
        localStorage.removeItem('checkout_cart');
        localStorage.setItem('buy_now_item', JSON.stringify(item));
      } catch (_error) {
        localStorage.removeItem('buy_now_item');
        localStorage.setItem('buy_now_item', JSON.stringify(item));
      }
      router.push('/checkout');
    } catch (err) {
      console.error('Buy now failed', err);
    }
  };

  const renderShoeSizeGuide = () => (
    <>
      <h2>{t('productDetail.sizeGuide').toUpperCase()}</h2>
      <p className="guide-intro">{t('productDetail.shoeSizeIntro')}</p>
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
                <td>{t('productDetail.sizeLabels.men')}</td>
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
                <td>{t('productDetail.sizeLabels.women')}</td>
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
                <td>{t('productDetail.sizeLabels.kids')}</td>
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
                <td>{t('productDetail.sizeLabels.footLength')}</td>
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
        <h4>{t('productDetail.inBetweenSizes')}</h4>
        <p>{t('productDetail.shoeSizeAdvice')}</p>
      </div>
    </>
  );

  const renderShirtSizeGuide = () => (
    <>
      <h2>{t('productDetail.sizeChart')}</h2>
      <p className="guide-intro">{t('productDetail.jerseyIntro')}</p>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead>
            <tr>
              <th>{t('productDetail.sizeGuideHeaders.size')}</th>
              <th>{t('productDetail.sizeGuideHeaders.height')}</th>
              <th>{t('productDetail.sizeGuideHeaders.weight')}</th>
              <th>{t('productDetail.sizeGuideHeaders.chestWidth')}</th>
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

      <h2>{t('productDetail.womensJerseySizeChart')}</h2>
      <div className="guide-table-wrap">
        <table className="guide-table">
          <thead>
            <tr>
              <th>{t('productDetail.sizeGuideHeaders.size')}</th>
              <th>{t('productDetail.sizeGuideHeaders.height')}</th>
              <th>{t('productDetail.sizeGuideHeaders.weight')}</th>
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
    return <div className="product-loading">{t('productDetail.loading')}</div>;
  }

  if (error || !product) {
    return (
      <div className="product-error">
        <p>{error || t('productDetail.notFound')}</p>
        <Link href="/products" className="back-to-products">
          {t('productDetail.backToProducts')}
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="product-detail-container">
      <Navbar />
      <div className="product-detail-header">
        <Link href="/products" className="back-link">{t('productDetail.backToProducts')}</Link>
      </div>

      <div className="product-detail-wrapper">
        {/* Image Section */}
        <div className="product-detail-image">
          <img src={product.image_url} alt={product.name} />
          {product.stock_quantity === 0 && (
            <div className="stock-overlay">{t('productDetail.outOfStock')}</div>
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
                <span className="in-stock">✓ {t('productDetail.inStock')}</span>
                <span className="stock-quantity">({product.stock_quantity} {t('productDetail.available')})</span>
              </>
            ) : (
              <span className="out-of-stock">{t('productDetail.outOfStock')}</span>
            )}
          </div>

          <div className="detail-description">
            <h3>{t('productDetail.description')}</h3>
            <p>{product.description}</p>
          </div>

          <div className="detail-purchase">
            <div className="quantity-selector">
              <label>{t('productDetail.quantity')}:</label>
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
                  onClick={() => setQuantity(Math.min(selectedSize && sizeStocks[selectedSize] !== undefined ? sizeStocks[selectedSize] : product.stock_quantity, quantity + 1))}
                  disabled={product.stock_quantity === 0}
                >
                  +
                </button>
              </div>
            </div>

            {sizeOptions.length > 0 && (
              <div className="quantity-selector size-selector">
                <label>{t('productDetail.sizes')}:</label>
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
                          <span className="in-stock">{sizeStocks[selectedSize]} {t('productDetail.available')}</span>
                        ) : sizeStocks[selectedSize] > 0 ? (
                          <span className="low-stock">{t('productDetail.lowStock')}</span>
                        ) : (
                          <span className="out-of-stock">{t('productDetail.outOfStockLabel')}</span>
                        )
                      ) : (
                        <span className="stock-unknown">{t('productDetail.stockUnknown')}</span>
                      )
                    ) : (
                      <span className="stock-hint">{t('productDetail.selectSizeHint')}</span>
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
              {addedToCart ? t('productDetail.addedToCart') : t('productDetail.addToCart')}
            </button>

            <button
              className="buy-now"
              onClick={handleBuyNow}
              disabled={product.stock_quantity === 0 || (sizeOptions.length > 0 && !selectedSize)}
            >
              {t('productDetail.buyNow')}
            </button>
          </div>

          <div className="detail-shipping">
            <div className="shipping-item">
              <span className="icon">📦</span>
              <div>
                <h4>{t('productDetail.freeShipping')}</h4>
                <p>{t('productDetail.shippingThreshold')}</p>
              </div>
            </div>
            <div className="shipping-item">
              <span className="icon">↩️</span>
              <div>
                <h4>{t('productDetail.easyReturns')}</h4>
                <p>{t('productDetail.returnPolicy')}</p>
              </div>
            </div>
            <div className="shipping-item">
              <span className="icon">🛡️</span>
              <div>
                <h4>{t('productDetail.secureCheckout')}</h4>
                <p>{t('productDetail.securePayment')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="related-products">
        <h3>{t('productDetail.youMightAlsoLike')}</h3>
        <div className="related-grid">
          {relatedLoading ? (
            <p>{t('productDetail.loading')}</p>
          ) : relatedProducts && relatedProducts.length > 0 ? (
            relatedProducts.map(r => (
              <div key={r.id} className="related-card">
                <Link href={`/product/${r.id}`} className="related-link">
                  <img src={r.image_url || '/default-product.jpg'} alt={r.name} />
                  <div className="related-info">
                    <div className="related-name">{r.name}</div>
                    <div className="related-price">${parseFloat(r.price || 0).toFixed(2)}</div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p>{t('productDetail.moreProductsSoon')}</p>
          )}
        </div>
      </div>
      <BasketballFooter />
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
