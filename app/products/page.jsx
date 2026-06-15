'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import BasketballFooter from '../../src/components/BasketballFooter';
import AddToCartButton from '../../src/components/AddToCartButton';
import { useLanguage } from '../../src/context/LanguageContext';
import './products.css';

export default function ProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 16;
  const maxVisibleCategories = 5;
  const searchParams = useSearchParams();
  const router = useRouter();

  const logSearchKeyword = async (keyword) => {
    const term = String(keyword || '').trim();
    if (!term) return;

    try {
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser)?.id : null;
      if (!userId) return;

      await fetch('/api/auth/search-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          keyword: term,
          source: 'products_page',
          searchType: 'text',
          metadata: { page: currentPage, category: selectedCategory || '' },
        }),
      });
      window.dispatchEvent(new Event('recommendations-updated'));
    } catch {
      // ignore search history logging failures
    }
  };

  useEffect(() => {
    const category = searchParams?.get('category') || '';
    const search = searchParams?.get('search') || '';
    setSelectedCategory(category);
    setSearchTerm(search);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, searchTerm, currentPage]);

  const updateQuery = (key, value) => {
    try {
      const params = new URLSearchParams(Array.from(searchParams || []));
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('offset');
      const qs = params.toString();
      router.push(`/products${qs ? `?${qs}` : ''}`);
    } catch (e) {
      console.error('updateQuery error', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error(`Categories request failed (${response.status})`);
      const data = await response.json();
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(
          data.categories
            .map((category) => (typeof category === 'string' ? category : category?.name))
            .filter(Boolean)
        );
      }
    } catch (fetchError) {
      console.error('Error fetching categories:', fetchError);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/products?limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`;

      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (searchTerm) url += `&search=${searchTerm}`;

      const response = await fetch(url);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Products request failed (${response.status}): ${text.slice(0, 120)}`);
      }

      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Products API returned non-JSON response: ${text.slice(0, 120)}`);
      }

      const data = await response.json();
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalPages(Math.max(1, Math.ceil((Number(data.total) || 0) / itemsPerPage)));
      }
    } catch (fetchError) {
      console.error('Error fetching products:', fetchError);
      setProducts([]);
      setError(fetchError.message || t('products.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateQuery('search', searchTerm.trim());
    logSearchKeyword(searchTerm);
    fetchProducts();
  };

  const handleCategoryChange = (category) => {
    const newVal = category === selectedCategory ? '' : category;
    setSelectedCategory(newVal);
    setCurrentPage(1);
    updateQuery('category', newVal);
  };

  return (
    <div className="products-container">
      <Navbar />
      <div className="products-header">
        <div className="header-content">
          <Link href="/" className="back-link">{t('products.backHome')}</Link>
          <h1>{t('products.title')}</h1>
          <p>{t('products.subtitle')}</p>
        </div>
      </div>

      <div className="products-wrapper">
        <aside className="products-sidebar">
          <div className="filter-section">
            <h3>{t('products.searchTitle')}</h3>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">{t('products.search')}</button>
            </form>
          </div>

          <div className="filter-section">
            <h3>{t('products.categories')}</h3>
            <div className="category-list">
              <button
                className={`category-btn ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                {t('products.allCategories')}
              </button>
              {categories.map((category, index) => (
                (index < maxVisibleCategories || showAllCategories) && (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </button>
                )
              ))}
            </div>
            {categories.length > maxVisibleCategories && (
              <button
                className="expand-btn"
                onClick={() => setShowAllCategories(!showAllCategories)}
                aria-expanded={showAllCategories}
              >
                <span className="expand-text">{showAllCategories ? t('products.hide') : t('products.showMore')}</span>
                <span className="chev" aria-hidden="true">›</span>
              </button>
            )}
          </div>
        </aside>

        <div className="products-main">
          {loading ? (
            <div className="products-loading">{t('products.loading')}</div>
          ) : error ? (
            <div className="products-empty">{error}</div>
          ) : (!products || products.length === 0) ? (
            <div className="products-empty">{t('products.empty')}</div>
          ) : (
            <>
              <div className="products-info">
                <p>
                  {t('products.showing').replace('{count}', products.length)}
                  {totalPages > 1 ? ` • ${t('products.pageInfo').replace('{page}', currentPage).replace('{totalPages}', totalPages)}` : ''}
                </p>
              </div>

              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      <Link href={`/product/${product.id}`}>
                        <img src={product.image_url} alt={product.name} />
                      </Link>
                      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                        <div className="product-badge">{t('products.onlyLeft').replace('{count}', product.stock_quantity)}</div>
                      )}
                      {product.stock_quantity === 0 && (
                        <div className="product-badge out-of-stock">{t('products.outOfStock')}</div>
                      )}
                    </div>

                    <div className="product-info">
                      <div className="product-categories">
                        {product.categories && Array.isArray(product.categories) && product.categories.map((cat, index) => (
                          <span key={index} className="product-category">{cat}</span>
                        ))}
                      </div>
                      <h3>
                        <Link href={`/product/${product.id}`}>{product.name}</Link>
                      </h3>
                      <p className="product-description">{(product.description || '').substring(0, 60)}...</p>

                      <div className="product-footer">
                        <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                        <AddToCartButton product={product} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ←
                  </button>

                  <div className="pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <BasketballFooter />
    </div>
  );
}
