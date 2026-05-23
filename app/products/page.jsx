'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import './products.css';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 16;
  const maxVisibleCategories = 5;

  const searchParams = useSearchParams();
  const router = useRouter();


  useEffect(() => {
    const category = searchParams?.get('category') || '';
    setSelectedCategory(category);
    setCurrentPage(1);
  }, [searchParams]);

  // UI labels (editable)
  const SHOW_MORE_TEXT = 'Show more';
  const HIDE_TEXT = 'Hide';

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, currentPage]);

  // helper to update query params in URL
  const updateQuery = (key, value) => {
    try {
      const params = new URLSearchParams(Array.from(searchParams || []));
      if (value) params.set(key, value);
      else params.delete(key);
      // reset page when filters change
      params.delete('offset');
      const qs = params.toString();
      router.push(`/products${qs ? '?' + qs : ''}`);
    } catch (e) {
      console.error('updateQuery error', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`;

      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }


      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
        // no-op: keep products and pagination only
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleCategoryChange = (category) => {
    const newVal = category === selectedCategory ? '' : category;
    setSelectedCategory(newVal);
    setCurrentPage(1);
    updateQuery('category', newVal);
  };

  // (Brand/Featured/Trending filters removed)

  return (
    <div className="products-container">
      <Navbar />
      {/* Header */}
      <div className="products-header">
        <div className="header-content">
          <Link href="/" className="back-link">← Back to Home</Link>
          <h1>Our Products</h1>
          <p>Discover our latest collection of premium shoes</p>
        </div>
      </div>

      <div className="products-wrapper">
        {/* Sidebar - Filters */}
        <aside className="products-sidebar">
          <div className="filter-section">
            <h3>Search</h3>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>

          <div className="filter-section">
            <h3>Categories</h3>
            <div className="category-list">
              <button
                className={`category-btn ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                All Categories
              </button>
              {categories && Array.isArray(categories) && categories.map((category, index) => (
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
            {categories && Array.isArray(categories) && categories.length > maxVisibleCategories && (
              <button
                className="expand-btn"
                onClick={() => setShowAllCategories(!showAllCategories)}
                aria-expanded={showAllCategories}
              >
                <span className="expand-text">{showAllCategories ? HIDE_TEXT : SHOW_MORE_TEXT}</span>
                <span className="chev" aria-hidden="true">›</span>
              </button>
            )}
          </div>

          {/* Brand/Featured/Trending filters removed */}
        </aside>

        {/* Main Content */}
        <div className="products-main">
          {loading ? (
            <div className="products-loading">Loading products...</div>
          ) : (!products || products.length === 0) ? (
            <div className="products-empty">No products found</div>
          ) : (
            <>
              <div className="products-info">
                <p>Showing {products.length} products</p>
              </div>

              {/* Products Grid */}
              <div className="products-grid">
                {products && Array.isArray(products) && products.map((product) => (
                  <Link
                    href={`/product/${product.id}`}
                    key={product.id}
                    className="product-card"
                  >
                    <div className="product-image">
                      <img src={product.image_url} alt={product.name} />
                      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                        <div className="product-badge">Only {product.stock_quantity} left!</div>
                      )}
                      {product.stock_quantity === 0 && (
                        <div className="product-badge out-of-stock">Out of Stock</div>
                      )}
                    </div>

                    <div className="product-info">
                      <div className="product-categories">
                        {product.categories && Array.isArray(product.categories) && product.categories.map((cat, index) => (
                          <span key={index} className="product-category">{cat}</span>
                        ))}
                      </div>
                      <h3>{product.name}</h3>
                      <p className="product-description">{product.description.substring(0, 60)}...</p>
                      
                      <div className="product-footer">
                        <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                        <button className="add-to-cart-btn">Add to Cart</button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
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
    </div>
  );
}
