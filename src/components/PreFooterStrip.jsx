'use client';

import Link from 'next/link';
import './PreFooterStrip.css';

const links = [
  { label: 'Find a Store', href: '/products' },
  { label: 'Support', href: '/contact' },
  { label: 'Join Us', href: '/register' },
  { label: 'Log In', href: '/login' },
];

export default function PreFooterStrip() {
  return (
    <section className="prefooter-strip" aria-label="Basketball brand links">
      <div className="prefooter-strip__logo-wrap">
        <img src="/logo.jpg" alt="ShoeShoe" className="prefooter-strip__logo" />
      </div>

      <nav className="prefooter-strip__links" aria-label="Quick links">
        {links.map((link) => (
          <Link key={link.label} href={link.href} className="prefooter-strip__link">
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
