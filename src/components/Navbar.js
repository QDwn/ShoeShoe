'use client';

import './Navbar.css';
import { useRef, useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInlineSearch, setShowInlineSearch] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPreview, setSearchPreview] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { getCount } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const getCurrentUserId = () => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser)?.id : null;
    } catch {
      return null;
    }
  };

  const logSearchKeyword = async ({ keyword, source = 'navbar', searchType = 'text', metadata = {} }) => {
    const userId = getCurrentUserId();
    if (!userId || !keyword?.trim()) return;

    try {
      await fetch('/api/auth/search-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          keyword: keyword.trim(),
          source,
          searchType,
          metadata,
        }),
      });
      window.dispatchEvent(new Event('recommendations-updated'));
    } catch {
      // ignore logging failures
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (searchPreview) {
        URL.revokeObjectURL(searchPreview);
      }
    };
  }, [searchPreview]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setShowInlineSearch(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-changed'));
    setUser(null);
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const closeSearchPanel = () => {
    setShowSearchPanel(false);
    setSearchResults([]);
    setSearchMessage('');
    setSearchPreview('');
    setIsSearching(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleInlineSearch = () => {
    setShowInlineSearch((prev) => !prev);
    if (showSearchPanel) {
      closeSearchPanel();
    }
  };

  const handleTextSearch = (event) => {
    event.preventDefault();
    const term = searchQuery.trim();
    if (!term) return;
    logSearchKeyword({ keyword: term, source: 'navbar', searchType: 'text' });
    router.push(`/products?search=${encodeURIComponent(term)}`);
    setShowInlineSearch(false);
  };

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  };

  const handleSearchImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowInlineSearch(true);
    setShowSearchPanel(true);
    setSearchMessage(t('nav.sendingImage'));
    setIsSearching(true);
    setSearchResults([]);

    const previewUrl = URL.createObjectURL(file);
    setSearchPreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        process.env.NEXT_PUBLIC_IMAGE_SEARCH_API_URL || 'http://localhost:8000/api/search-image',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || t('nav.noMatches'));
      }

      const results = Array.isArray(data.similar_products) ? data.similar_products : [];
      setSearchResults(results);
      setSearchMessage(results.length > 0 ? t('nav.imageResults') : t('nav.noMatches'));
      logSearchKeyword({
        keyword: file.name || 'image search',
        source: 'navbar',
        searchType: 'image',
        metadata: { file_name: file.name, mime_type: file.type, size: file.size },
      });
      window.dispatchEvent(new Event('recommendations-updated'));
    } catch (error) {
      setSearchResults([]);
      setSearchMessage(error.message || t('nav.noMatches'));
    } finally {
      setIsSearching(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const menuItems = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.products'), href: '/products' },
    { label: t('nav.stores'), href: '/stores' },
    { label: t('nav.about'), href: '/about' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href} className={`navbar-link ${isActive(item.href) ? 'is-active' : ''}`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="navbar-brand">
        <Link href="/" className="navbar-logo" aria-label="Go to home">
          <img src="/logo.png" alt="Grind Hoops" />
        </Link>
      </div>

      <div className="navbar-right">
        <div ref={searchWrapRef} className={`navbar-search-shell ${showInlineSearch ? 'is-open' : ''}`}>
          <button
            className="navbar-icon-button navbar-search-trigger"
            type="button"
            aria-label={t('nav.searchByImage')}
            aria-expanded={showInlineSearch}
            aria-controls="navbar-search-inline"
            onClick={toggleInlineSearch}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.5 4a6.5 6.5 0 1 0 4.1 11.5l4.4 4.4 1.4-1.4-4.4-4.4A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
            </svg>
          </button>

          <form id="navbar-search-inline" className="navbar-inline-search" onSubmit={handleTextSearch}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.searchProducts') || 'Search products...'}
              aria-label={t('nav.searchProducts') || 'Search products'}
            />
            <button type="submit" className="navbar-inline-search-submit">
              {t('nav.search') || 'Search'}
            </button>
            <button
              type="button"
              className="navbar-inline-image-button"
              onClick={() => {
                setShowInlineSearch(true);
                setShowSearchPanel(true);
              }}
              aria-label={t('nav.searchByImage')}
            >
              {t('nav.searchByImage') || 'Image'}
            </button>
          </form>
        </div>

        <input
          ref={fileInputRef}
          className="navbar-search-input"
          type="file"
          accept="image/*"
          onChange={handleSearchImage}
          aria-label={t('nav.searchByImage')}
        />

        <div
          id="navbar-image-search-panel"
          className={`navbar-search-panel ${showSearchPanel ? 'is-open' : ''}`}
          role="dialog"
          aria-hidden={!showSearchPanel}
          aria-label={t('nav.imageResults')}
        >
          <div className="navbar-search-panel-inner">
            <div className="navbar-search-panel-header">
              <div>
                <p className="navbar-search-eyebrow">{t('nav.imageSearch')}</p>
                <h3>{t('nav.chooseShoeImage')}</h3>
              </div>
              <button className="navbar-search-close" type="button" onClick={closeSearchPanel} aria-label={t('nav.close')}>
                ×
              </button>
            </div>

            <button className="navbar-search-upload" type="button" onClick={() => fileInputRef.current?.click()}>
              {t('nav.chooseImage')}
            </button>

            {searchPreview && (
              <div className="navbar-search-preview">
                <img src={searchPreview} alt="Selected image" />
              </div>
            )}

            <div className="navbar-search-status">
              {isSearching ? t('nav.analyzing') : searchMessage || t('nav.uploading')}
            </div>

            <div className="navbar-search-results">
              {searchResults.map((item) => (
                <Link
                  href={`/product/${item.product_id}`}
                  className="navbar-search-result-card"
                  key={`${item.product_id}-${item.similarity_score}`}
                >
                  <img src={resolveImageUrl(item.image_url)} alt={item.name} />
                  <div className="navbar-search-result-meta">
                    <strong>{item.name}</strong>
                    <span>{Number(item.price).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} đ</span>
                    <span>
                      {item.similarity_score}% {t('nav.similar')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {user ? (
          <div className="navbar-profile-container">
            <button className="navbar-icon-button" onClick={toggleDropdown} type="button" aria-label={t('nav.account')}>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="navbar-avatar navbar-avatar-icon" />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
                </svg>
              )}
            </button>

            {showDropdown && (
              <div className="navbar-dropdown">
                <Link href="/profile" className="dropdown-item">{t('nav.profile')}</Link>
                <button onClick={handleLogout} className="dropdown-item logout-btn">{t('nav.logout')}</button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="navbar-icon-button" aria-label={t('nav.login')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
            </svg>
          </Link>
        )}

        <Link href="/cart" className="navbar-icon-button navbar-cart-link" aria-label={`${t('nav.cart')} (${getCount()})`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 18.5A1.5 1.5 0 1 0 8.5 20 1.5 1.5 0 0 0 7 18.5Zm10 0A1.5 1.5 0 1 0 18.5 20 1.5 1.5 0 0 0 17 18.5ZM6.2 6l.4 2H20l-1.3 6.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.2 4H2V2h4a1 1 0 0 1 1 .8L7.4 6Z" />
          </svg>
          <span className="navbar-cart-count">{getCount()}</span>
        </Link>

        <div className="navbar-language-switch" role="group" aria-label={t('nav.language')}>
          <button
            type="button"
            className={`navbar-language-button ${language === 'en' ? 'is-active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            {t('nav.english')}
          </button>
          <button
            type="button"
            className={`navbar-language-button ${language === 'vi' ? 'is-active' : ''}`}
            onClick={() => setLanguage('vi')}
          >
            {t('nav.vietnamese')}
          </button>
        </div>
      </div>

      <div className="navbar-mobile-spacer" />
    </nav>
  );
}
