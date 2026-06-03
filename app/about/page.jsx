"use client";

import './page.css';
import { useLanguage } from '../../src/context/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="about-page">
      <header className="about-hero">
        <img src="/about%20us2.png" alt="Dirty Coins" className="about-hero-image" />
      </header>

      <section className="about-content">
        <p className="about-paragraph">{t('about.intro')}</p>

        <div className="about-image-wrap">
          <img src="/about%20pic.jpg" alt="Court photo" className="about-illustration" />
        </div>
        <div className="about-image-wrap1">
            {t('about.statementTitle')}
        </div>
        <div className="about-image-wrap2">
            {t('about.body')}
        </div>
      </section>
    </main>
  );
}
