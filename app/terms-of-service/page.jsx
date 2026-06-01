import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import './page.css';

const sections = [
  {
    title: 'Acceptance of Terms',
    body: [
      'By accessing or using ShoeShoe (the "Site"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the Site.'
    ],
  },
  {
    title: 'Using the Site',
    body: [
      'You agree to use the Site only for lawful purposes and in accordance with these Terms. You must not use the Site in any way that causes, or may cause, damage to the Site or impairment of the availability or accessibility of the Site.'
    ],
  },
  {
    title: 'Orders and Acceptance',
    body: [
      'Placing an order through the Site constitutes an offer to purchase. All orders are subject to acceptance and availability. We may refuse or cancel any order for reasons including product availability, errors in pricing or product description, or suspected fraud.'
    ],
  },
  {
    title: 'Product Information and Pricing',
    body: [
      'We strive to provide accurate product information. However, we do not warrant that product descriptions, pricing, or other content are complete, accurate, reliable, or error-free. Prices and availability are subject to change without notice.'
    ],
  },
  {
    title: 'Payments and Taxes',
    body: [
      'Payment must be received before order fulfillment. You are responsible for any taxes, duties, or fees imposed by your local jurisdiction. We use third-party payment processors; their terms may also apply.'
    ],
  },
  {
    title: 'Shipping, Delivery and Title',
    body: [
      'Shipping times are estimates and may vary. Title and risk of loss for products pass to you upon our delivery to the carrier unless otherwise stated.'
    ],
  },
  {
    title: 'Returns and Refunds',
    body: [
      'Our returns policy is available on the Site. Returns, exchanges, and refunds are processed according to the published policy and may be subject to conditions and time limits.'
    ],
  },
  {
    title: 'User Accounts and Security',
    body: [
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.'
    ],
  },
  {
    title: 'Intellectual Property',
    body: [
      'All content on the Site, including text, graphics, logos, images, and software, is the property of ShoeShoe or its licensors and protected by intellectual property laws.'
    ],
  },
  {
    title: 'Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, ShoeShoe will not be liable for indirect, incidental, special, consequential or punitive damages arising out of your use of the Site or products purchased through the Site.'
    ],
  },
  {
    title: 'Indemnification',
    body: [
      'You agree to indemnify and hold ShoeShoe harmless from any claims, losses, liabilities, damages, expenses and costs arising from your violation of these Terms or your use of the Site.'
    ],
  },
  {
    title: 'Governing Law',
    body: [
      'These Terms are governed by and construed in accordance with the laws of Vietnam, and you submit to the exclusive jurisdiction of the courts located in Vietnam for any dispute arising out of these Terms.'
    ],
  },
  {
    title: 'Changes to Terms',
    body: [
      'We may revise these Terms from time to time. The updated version will be effective as of the date shown on the page. Continued use of the Site after changes constitutes acceptance.'
    ],
  },
  {
    title: 'Contact',
    body: [
      'If you have questions about these Terms, please contact us at support@shoeshoe.vn or call 1900-6092.'
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="privacy-policy-page">
      <Navbar />
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span className="breadcrumb-sep">›</span>
        <span>Terms of Service</span>
      </nav>
      <section className="privacy-policy-hero">
        <img src="/logo.png" alt="Dirty Coins" className="privacy-policy-logo" />
        <h1>Terms of Service</h1>
      </section>

      <section className="privacy-policy-content" aria-label="Terms of Service details">
        <p className="privacy-policy-updated">Last updated: May 27, 2026</p>

        {sections.map((section) => (
          <article key={section.title} className="privacy-section">
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}

        <article className="privacy-section privacy-section--contact">
          <h2>Contact Us</h2>
          <p>
            For questions about these Terms, contact us at <a href="mailto:csteamdcs@gmail.com">csteamdcs@gmail.com</a> or call <a href="tel:+84933800190">+84 933 800 190</a>.
          </p>
          <p>
            Store address: <span>561 Su Van Hanh Street, Hoa Hung Ward, Ho Chi Minh City, Vietnam</span>
          </p>
        </article>
      </section>
    </main>
  );
}
