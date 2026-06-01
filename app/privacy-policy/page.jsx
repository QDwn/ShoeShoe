import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import './page.css';

const sections = [
  {
    title: 'Personal Information We Collect',
    body: [
      'We collect information you provide when you create an account, place an order, sign up for emails, contact support, or join a promotion. This may include your name, email address, phone number, shipping address, billing details, and account credentials.',
      'We also collect device and usage information such as your browser type, pages viewed, time spent on the site, cart activity, and approximate location so we can improve the shopping experience and keep the site secure.',
    ],
  },
  {
    title: 'Account and Profile Information',
    body: [
      'If you create an account, we store the information needed to manage your profile, save your preferences, and make checkout faster on future visits.',
      'You are responsible for keeping your login credentials safe. Please notify us immediately if you believe your account has been used without permission.',
    ],
  },
  {
    title: 'How We Use Your Information',
    body: [
      'ShoeShoe uses your information to process orders, deliver products, send order confirmations and shipping updates, manage returns, respond to support requests, and personalize your shopping experience.',
      'We may also use your information to prevent fraud, troubleshoot issues, analyze store performance, and send marketing messages when you have chosen to receive them.',
    ],
  },
  {
    title: 'Sharing Your Information',
    body: [
      'We share personal information only when needed to run the store. This includes payment processors, delivery partners, analytics providers, customer support tools, and hosting services.',
      'We may also disclose information if required by law, to protect our rights, or to prevent abuse, fraud, or security threats.',
    ],
  },
  {
    title: 'Orders, Shipping, and Returns',
    body: [
      'When you place an order, we use your shipping and contact details to confirm payment, fulfill the order, and arrange delivery. Tracking information may be shared with you through email or SMS.',
      'If you request a return, exchange, or warranty review, we keep the necessary order records to complete the request and improve our service quality.',
    ],
  },
  {
    title: 'Payments and Fraud Prevention',
    body: [
      'Payment details are processed by our payment providers and are handled according to their security standards. We do not store full card numbers on our own systems unless required for a specific transaction flow.',
      'We may review transactions, account activity, and technical signals to detect fraud, unauthorized access, or misuse of the website.',
    ],
  },
  {
    title: 'Cookies and Tracking',
    body: [
      'We use cookies and similar technologies to keep items in your cart, remember your preferences, understand how visitors use the website, and measure marketing performance.',
      'You can disable cookies through your browser settings, but some parts of the site may not work correctly if cookies are turned off.',
    ],
  },
  {
    title: 'Marketing and Communications',
    body: [
      'If you subscribe to newsletters or promotions, we may send emails about new arrivals, sale events, product launches, and store updates that we think may interest you.',
      'You can opt out of marketing emails at any time by using the unsubscribe link in the message or by contacting our support team.',
    ],
  },
  {
    title: 'Your Rights and Choices',
    body: [
      'You can request access, correction, or deletion of your personal information where applicable by contacting us. You may also unsubscribe from promotional emails at any time using the link in the message.',
      'If you have an account, you can update some of your details directly from your profile or by reaching out to our support team.',
    ],
  },
  {
    title: 'Third-Party Services',
    body: [
      'Our website may use third-party services such as analytics tools, payment gateways, shipping providers, and customer support platforms. These providers may collect or process information on our behalf.',
      'Their use of your information is governed by their own privacy policies and terms, so we recommend reviewing those policies as well.',
    ],
  },
  {
    title: 'Data Security and Retention',
    body: [
      'We use reasonable technical and organizational safeguards to protect your information, but no online system can be guaranteed to be completely secure.',
      'We keep personal information only as long as needed for the purposes described in this policy, to comply with legal obligations, resolve disputes, and maintain business records.',
    ],
  },
  {
    title: 'International Access',
    body: [
      'Because our website may be accessed from different locations, your information may be processed in countries where our service providers operate. We take steps to handle that information responsibly and in line with this policy.',
    ],
  },
  {
    title: 'Children and Minors',
    body: [
      'Our website is intended for general retail shopping and is not directed to children. We do not knowingly collect personal information from children without appropriate permission where required by law.',
    ],
  },
  {
    title: 'Policy Updates and Contact',
    body: [
      'We may revise this policy when our services, legal obligations, or business practices change. Updates will appear on this page, and the new date will reflect the latest version.',
      'If you need help understanding any part of this policy, our support team is available by email, phone, or through the website contact page.',
    ],
  },
  {
    title: 'Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, products, or legal requirements. Any changes will be posted on this page with a revised effective date.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-policy-page">
      <Navbar />
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span className="breadcrumb-sep">›</span>
        <span>Privacy policy</span>
      </nav>
      <section className="privacy-policy-hero">
        <img src="/logo.png" alt="Dirty Coins" className="privacy-policy-logo" />
        <h1>Privacy policy</h1>
      </section>

      <section className="privacy-policy-content" aria-label="Privacy policy details">
        <p className="privacy-policy-updated">Last updated: May 27, 2026</p>

        <p className="privacy-policy-intro">
          Dirty Coins operates this store and website, including all related information, content, features, tools, products and services, in order to provide you with a curated shopping experience. This Privacy Policy explains how we collect, use, and disclose your personal information when you visit, use, or make a purchase from our website or communicate with us.
        </p>

        <p className="privacy-policy-intro">
          Please read this Privacy Policy carefully. By using and accessing the website, you acknowledge that you have read this Privacy Policy and understand the collection, use, and disclosure of your information as described here.
        </p>

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
            If you have questions about this policy or how your information is handled, please contact us at{' '}
              <a href="mailto:grindhoops@gmail.com">grindhoops@gmail.com</a> or call{' '}
              {' '}
              <a href="tel:+8484333657424">+84 333 657 424</a>.
          </p>
          <p>
            Store address: <span>175 P. Tay Son, Kim Lien, Ha Noi, Viet Nam</span>
          </p>
          <p>
            For order support, returns, or account questions, please include your name and order number so we can help you faster.
          </p>
        </article>
      </section>
    </main>
  );
}