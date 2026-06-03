'use client';

import Link from 'next/link';
import './PreFooterStrip.css';
import { useLanguage } from '../context/LanguageContext';

export default function PreFooterStrip() {
  const { t } = useLanguage();

  const links = [
    { label: t('prefooter.support'), href: '/contact' },
    { label: t('prefooter.joinUs'), href: '/register' },
    { label: t('prefooter.logIn'), href: '/login' },
  ];

  return (
    <section className="prefooter-strip" aria-label="Basketball brand links">
      <div className="prefooter-strip__logo-wrap">
        <img src="/logo.png" alt="Dirty Coins" className="prefooter-strip__logo" />
      </div>

      <nav className="prefooter-strip__links" aria-label="Quick links">
        <Link href="/stores" className="prefooter-strip__link prefooter-strip__link--button">
          {t('prefooter.findStore')}
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
