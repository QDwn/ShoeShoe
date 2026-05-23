'use client';

import './Navbar.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Kiểm tra user từ localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <img src="/logo.jpg" alt="Logo" />
        <h2>Shoe Store</h2>
      </div>

      {/* Menu */}
      <div className="navbar-menu">
        <Link href="/" className="navbar-link">Home</Link>

        {/* Products Dropdown */}
        <div className="menu-item">
          <Link href="/products" className="menu-item-label">Products</Link>
          <div className="submenu-products">
            <div className="submenu-products-wrapper">
              <div className="submenu-column">
                <h4>Featured</h4>
                <Link href="/products?featured=new" className="submenu-item">New Arrivals</Link>
                <Link href="/products?featured=limited" className="submenu-item">Limited Edition</Link>
                <Link href="/products?category=NBA All-Star" className="submenu-item">NBA All Star</Link>
              </div>
              <div className="submenu-column">
                <h4>Trending</h4>
                <Link href="/products?trend=best" className="submenu-item">Best Sellers</Link>
                <Link href="/products?trend=hot" className="submenu-item">Hot This Week</Link>
                <Link href="/products?trend=rated" className="submenu-item">Top Rated</Link>
              </div>
              <div className="submenu-column">
                <h4>Brand</h4>
                <Link href="/products?category=LeBron James" className="submenu-item">LeBron</Link>
                <Link href="/products?category=Stephen Curry" className="submenu-item">Curry</Link>
                <Link href="/products?category=Lamelo Ball" className="submenu-item">Lamelo</Link>
                <Link href="/products?category=Sabrina" className="submenu-item">Sabrina</Link>
              </div>
              <div className="submenu-column">
                <h4>Categories</h4>
                <Link href="/products?category=Basketball%20Shoes" className="submenu-item">Basketball Shoes</Link>
                <Link href="/products?category=Jersey" className="submenu-item">Jerseys</Link>
                <Link href="/products?category=Socks" className="submenu-item">Socks</Link>
                <Link href="/products?category=Accessories" className="submenu-item">Accessories</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Man Dropdown */}
        <div className="menu-item">
          <div className="menu-item-label">Man</div>
          <div className="submenu-man">
            <div className="submenu-wrapper">
              <div className="submenu-column">
                <h4>Categories</h4>
                <a href="/man/shoes" className="submenu-item">Shoes</a>
                <a href="/man/boots" className="submenu-item">Boots</a>
                <a href="/man/sandals" className="submenu-item">Sandals</a>
              </div>
              <div className="submenu-column">
                <h4>Style</h4>
                <a href="/man/casual" className="submenu-item">Casual</a>
                <a href="/man/athletic" className="submenu-item">Athletic</a>
                <a href="/man/formal" className="submenu-item">Formal</a>
              </div>
              <div className="submenu-column">
                <h4>Size</h4>
                <a href="/man/size-small" className="submenu-item">Small (6-8)</a>
                <a href="/man/size-medium" className="submenu-item">Medium (9-11)</a>
                <a href="/man/size-large" className="submenu-item">Large (12+)</a>
              </div>
              <div className="submenu-column">
                <h4>Price</h4>
                <a href="/man/budget" className="submenu-item">Under $50</a>
                <a href="/man/standard" className="submenu-item">$50-$100</a>
                <a href="/man/premium" className="submenu-item">$100+</a>
              </div>
            </div>
          </div>
        </div>

        {/* Woman Dropdown */}
        <div className="menu-item">
          <div className="menu-item-label">Woman</div>
          <div className="submenu-woman">
            <div className="submenu-wrapper">
              <div className="submenu-column">
                <h4>Categories</h4>
                <a href="/woman/shoes" className="submenu-item">Shoes</a>
                <a href="/woman/boots" className="submenu-item">Boots</a>
                <a href="/woman/heels" className="submenu-item">Heels</a>
              </div>
              <div className="submenu-column">
                <h4>Style</h4>
                <a href="/woman/casual" className="submenu-item">Casual</a>
                <a href="/woman/athletic" className="submenu-item">Athletic</a>
                <a href="/woman/elegant" className="submenu-item">Elegant</a>
              </div>
              <div className="submenu-column">
                <h4>Size</h4>
                <a href="/woman/size-small" className="submenu-item">Small (5-7)</a>
                <a href="/woman/size-medium" className="submenu-item">Medium (8-10)</a>
                <a href="/woman/size-large" className="submenu-item">Large (11+)</a>
              </div>
              <div className="submenu-column">
                <h4>Price</h4>
                <a href="/woman/budget" className="submenu-item">Under $50</a>
                <a href="/woman/standard" className="submenu-item">$50-$100</a>
                <a href="/woman/premium" className="submenu-item">$100+</a>
              </div>
            </div>
          </div>
        </div>

        <a href="/contact" className="navbar-link">Contact</a>
        <a href="/about" className="navbar-link">About</a>

        {/* Auth Section */}
        {user ? (
          <div className="navbar-profile-container">
            <button className="navbar-profile-btn" onClick={toggleDropdown}>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="navbar-avatar" />
              ) : (
                <div className="navbar-avatar-placeholder">{user.name?.[0]?.toUpperCase()}</div>
              )}
              <span>{user.name}</span>
            </button>

            {showDropdown && (
              <div className="navbar-dropdown">
                <Link href="/profile" className="dropdown-item">Profile</Link>
                <button onClick={handleLogout} className="dropdown-item logout-btn">Logout</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <a href="/login" className="navbar-login">Login</a>
            <a href="/register" className="navbar-register">Register</a>
          </>
        )}
      </div>
    </nav>
  );
}