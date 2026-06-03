'use client';

import Link from 'next/link';
import './BasketballFooter.css';
import { useLanguage } from '../context/LanguageContext';

const socialLinks = [
  {
    name: 'Facebook',
    href: '',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 9.5V8c0-.8.5-1 1-1h1.5V4H14c-2.2 0-4 1.8-4 4v1.5H8V13h2v7h3v-7h2.4l.6-3.5H13V9.5c0-.8.4-1 1-1z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: '',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 2.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Zm0 2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM17.8 6.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: '',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21.8 8.2s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C16.1 5 12 5 12 5s-4.1 0-6.9.3c-.4 0-1.3.1-2.1.9-.6.6-.8 2-.8 2S2 9.8 2 11.4v1.2c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.9.8 2.4.9 1.8.2 6.6.3 6.6.3s4.1 0 6.9-.3c.4 0 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.2c0-1.6-.2-3.2-.2-3.2ZM10 15.2V8.8l6 3.2-6 3.2Z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: '',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16.5 3c.3 2.3 1.6 3.7 3.8 3.9v3.1c-1.4.1-2.7-.3-3.8-1.1v5.8c0 3.3-2.7 6.1-6.1 6.1-3.6 0-6.3-2.9-6.3-6.5 0-3.6 2.9-6.4 6.5-6.4.3 0 .6 0 .9.1v3.5c-.3-.1-.6-.2-.9-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9c1.7 0 3-1.4 3-3V3h2.9Z" />
      </svg>
    ),
  },
];

export default function BasketballFooter() {
  const { t } = useLanguage();

  const introLinks = [
    { label: t('footer.introduction'), href: '/about' },
    { label: t('footer.privacyPolicy'), href: '/privacy-policy' },
    { label: t('footer.termsOfService'), href: '/terms-of-service' },
    { label: t('footer.faq'), href: '/faq' },
  ];

  const newsLinks = [
    { label: t('footer.events'), href: '/events' },
    { label: t('footer.sale'), href: '/sale' },
    { label: t('footer.newShoes'), href: '/new-arrivals' },
    { label: t('footer.basketballNews'), href: '/news' },
  ];

  return (
    <footer className="basketball-footer">
      <div className="footer-glow footer-glow-left" />
      <div className="footer-glow footer-glow-right" />

      <div className="footer-shell">
        <div className="footer-top">
          <div className="footer-brand-panel">
            <div className="footer-brand">
              <img src="/logo.png" alt="ShoeShoe" className="footer-logo" />
              <div>
                <p className="footer-kicker">{t('footer.kicker')}</p>
                <h2>{t('footer.title')}</h2>
              </div>
            </div>
            <p className="footer-description">
              {t('footer.description')}
            </p>
            <div className="footer-socials" aria-label="Social links">
              {socialLinks.map((social) => (
                <a key={social.name} href={social.href} className="footer-social" aria-label={social.name} target="_blank" rel="noreferrer">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h3>{t('footer.introduction')}</h3>
              {introLinks.map((link) => (
                <Link key={link.label} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="footer-column">
              <h3>{t('footer.news')}</h3>
              {newsLinks.map((link) => (
                <Link key={link.label} href={link.href} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="footer-column footer-support-column">
              <h3>{t('footer.support')}</h3>
              <a className="footer-link" href="tel:19006092">
                {t('footer.hotline')}: 1900-6092
              </a>
              <a className="footer-link" href="mailto:support@shoeshoe.vn">
                support@shoeshoe.vn
              </a>
              <a className="footer-link" href="/login">
                {t('nav.login')}
              </a>
              <a className="footer-link" href="/register">
                {t('footer.createAccount')}
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.copyright')}</p>
        </div>
        <div className="location">
          <p>{t('footer.location')}</p>
        </div>
      </div>
    </footer>
  );
}
