import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import './page.css';

const storeLocation = '175 P. Tay Son, Kim Lien, Ha Noi, Viet Nam';
const storeMapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(storeLocation)}&output=embed`;
const storeMapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeLocation)}`;

const highlights = [
  { label: 'Address', value: '175 P. Tay Son, Kim Lien, Ha Noi, Viet Nam' },
  { label: 'Phone', value: '+84 333 657 424' },
  { label: 'Open', value: 'Mon–Sun: 9am–10pm' },
];

export default function StoresPage() {
  return (
    <main className="stores-page">
      <Navbar />

      <section className="stores-hero">
        <p className="stores-kicker">Find a store</p>
        <h1>FIND A STORE</h1>
        <p className="stores-intro">
          Have a question or comment? Don’t be shy: Reach out and say hi!
          <span>Support hours: 9am–10pm</span>
        </p>
      </section>

      <section className="stores-content" aria-label="Store location details">
        <div className="stores-header-row">
          <h2>Viet Nam</h2>
          <a className="stores-directions" href={storeMapSearchUrl} target="_blank" rel="noreferrer">
            Get Directions
          </a>
        </div>

        <div className="stores-layout">
          <div className="stores-gallery" aria-label="Store images">
            <img src="/storeee.png" alt="Grind Hoops store interior" className="stores-image stores-image--single" />
          </div>

          <div className="stores-details">
            <p>
              <span>Address:</span> {storeLocation}
            </p>
            <p>
              <span>Phone:</span> +84 333 657 424
            </p>
            <p>
              <span>Mon–Sun:</span> 9am–10pm
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
          <Link href="/faq">Need answers first? Visit our FAQ</Link>
        </div>
      </section>
    </main>
  );
}