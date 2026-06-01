import Navbar from '../../src/components/Navbar';
import './page.css';

const faqs = [
  {
    q: '1. Where is Grind Hoops located?',
    a: [
      'Our store is located at:',
      '175 P. Tay Son, Kim Lien, Ha Noi, Viet Nam',
    ],
  },
  {
    q: '2. How can I contact Grind Hoops?',
    a: [
      'You can reach us through:',
      <a href="tel:+8484333657424">Hotline: +84 333 657 424</a>,
      <a href="mailto:grindhoops@gmail.com">Email: grindhoops@gmail.com</a>,
      <a href="https://grindhoopsvn.com" target="_blank" rel="noopener noreferrer">Website: grindhoopsvn.com</a>,
    ],
  },
  {
    q: '3. What products does Grind Hoops offer?',
    a: [
      'We specialize in basketball gear and apparel, including basketball shoes, jerseys, shorts, hoodies, accessories, and training equipment designed with a modern, athletic, and performance-driven style.',
    ],
  },
  {
    q: '4. Can I shop directly at the store?',
    a: [
      'Yes. You are welcome to visit our showroom at 175 P. Tay Son, Kim Lien, Ha Noi, Viet Nam for in-store shopping.',
    ],
  },
  {
    q: '5. Do you offer nationwide shipping?',
    a: [
      'Yes. Grind Hoops provides shipping across Vietnam via reliable delivery partners.',
    ],
  },
  {
    q: '6. Can I exchange or return an item?',
    a: [
      'Yes. You may exchange or return your item within 7 days of receiving it, as long as it remains unused, with original tags and packaging intact.',
    ],
  },
  {
    q: '7. What payment methods are accepted?',
    a: [
      'We accept the following payment options:',
      'Bank transfer',
    ],
  },
  {
    q: '8. How can I get further support?',
    a: [
      'For assistance, please call +84 333 657 424 or email us at grindhoops@gmail.com. Our support team will be happy to help you.',
    ],
  },
];

export default function FAQPage() {
  return (
    <main className="privacy-policy-page">
      <Navbar />
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span className="breadcrumb-sep">›</span>
        <span>FAQ</span>
      </nav>
      <section className="privacy-policy-hero">
        <img src="/logo.png" alt="Grind Hoops" className="privacy-policy-logo" />
        <h1>FAQ</h1>
      </section>

      <section className="privacy-policy-content" aria-label="FAQ details">
        <p className="privacy-policy-updated">Last updated: May 27, 2026</p>

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
