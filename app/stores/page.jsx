"use client";

import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import BasketballFooter from '../../src/components/BasketballFooter';
import { useLanguage } from '../../src/context/LanguageContext';
import './page.css';

export default function StoresPage() {
  const { t } = useLanguage();
  const storeLocation = t('stores.storeLocation');
  const storeMapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(storeLocation)}&output=embed`;
  const storeMapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeLocation)}`;

  return (
    <main className="stores-page">
      <Navbar />

      <section className="stores-hero">
        <p className="stores-kicker">{t('stores.kicker')}</p>
        <h1>{t('stores.title')}</h1>
        <p className="stores-intro">
          {t('stores.intro')}
          <span>{t('stores.supportHours')}</span>
        </p>
      </section>

      <section className="stores-content" aria-label="Store location details">
        <div className="stores-header-row">
          <h2>{t('stores.country')}</h2>
          <a className="stores-directions" href={storeMapSearchUrl} target="_blank" rel="noreferrer">
            {t('stores.directions')}
          </a>
        </div>

        <div className="stores-layout">
          <div className="stores-gallery" aria-label="Store images">
            <img src="/storeee.png" alt="Grind Hoops store interior" className="stores-image stores-image--single" />
          </div>

          <div className="stores-details">
            <p>
              <span>{t('stores.address')}:</span> {storeLocation}
            </p>
            <p>
              <span>{t('stores.phone')}:</span> +84 333 657 424
            </p>
            <p>
              <span>{t('stores.monSun')}:</span> {t('stores.hours')}
            </p>

            <div className="stores-map-wrap">
              <iframe
                title="Grind Hoops store location"
                src={storeMapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="stores-map"
              />
            </div>
          </div>
        </div>

        <div className="stores-footer-note">
          <Link href="/faq">{t('stores.faqLink')}</Link>
        </div>
      </section>

      <BasketballFooter />
    </main>
  );
}