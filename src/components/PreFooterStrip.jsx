'use client';

import Link from 'next/link';
import './PreFooterStrip.css';

const links = [
  { label: 'Support', href: '/contact' },
  { label: 'Join Us', href: '/register' },
  { label: 'Log In', href: '/login' },
];

export default function PreFooterStrip() {
  return (
    <section className="prefooter-strip" aria-label="Basketball brand links">
      <div className="prefooter-strip__logo-wrap">
        <img src="/logo.png" alt="Dirty Coins" className="prefooter-strip__logo" />
      </div>

      <nav className="prefooter-strip__links" aria-label="Quick links">
        <Link href="/stores" className="prefooter-strip__link prefooter-strip__link--button">
          Find a Store
        </Link>

        {links.map((link) => (
          <Link key={link.label} href={link.href} className="prefooter-strip__link">
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
