'use client';

import './Navbar.css';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { getCount } = useCart();
  const pathname = usePathname();

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

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Stores', href: '/stores' },
    { label: 'About', href: '/about' },
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
        <button className="navbar-icon-button" type="button" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 4a6.5 6.5 0 1 0 4.1 11.5l4.4 4.4 1.4-1.4-4.4-4.4A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
          </svg>
        </button>

        {user ? (
          <div className="navbar-profile-container">
            <button className="navbar-icon-button" onClick={toggleDropdown} type="button" aria-label="Account">
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
                <Link href="/profile" className="dropdown-item">Profile</Link>
                <button onClick={handleLogout} className="dropdown-item logout-btn">Logout</button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="navbar-icon-button" aria-label="Login">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
            </svg>
          </Link>
        )}

        <Link href="/cart" className="navbar-icon-button navbar-cart-link" aria-label={`Cart (${getCount()})`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 18.5A1.5 1.5 0 1 0 8.5 20 1.5 1.5 0 0 0 7 18.5Zm10 0A1.5 1.5 0 1 0 18.5 20 1.5 1.5 0 0 0 17 18.5ZM6.2 6l.4 2H20l-1.3 6.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.2 4H2V2h4a1 1 0 0 1 1 .8L7.4 6Z" />
          </svg>
          <span className="navbar-cart-count">{getCount()}</span>
        </Link>
      </div>

      <div className="navbar-mobile-spacer" />
    </nav>
  );
}