"use client";

import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import { useLanguage } from '../../src/context/LanguageContext';
import './page.css';

export default function FAQPage() {
  const { t } = useLanguage();
  const faqs = t('faq.items');

  return (
    <main className="privacy-policy-page">
      <Navbar />
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{t('faq.breadcrumb')}</span>
      </nav>
      <section className="privacy-policy-hero">
        <img src="/logo.png" alt="Grind Hoops" className="privacy-policy-logo" />
        <h1>{t('faq.title')}</h1>
      </section>

      <section className="privacy-policy-content" aria-label="FAQ details">
        <p className="privacy-policy-updated">{t('faq.updated')}</p>

        {faqs.map((item) => (
          <article key={item.q} className="privacy-section">
            <h2>{item.q}</h2>
            {item.a.map((p, idx) => (
              <p key={`${item.q}-a-${idx}`}>{p}</p>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
