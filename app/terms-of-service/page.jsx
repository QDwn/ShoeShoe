'use client';

import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import { useLanguage } from '../../src/context/LanguageContext';
import './page.css';

const content = {
  en: {
    title: 'Terms of Service',
    sections: [
      {
        title: 'Acceptance of Terms',
        body: ['By accessing or using ShoeShoe, you agree to be bound by these Terms of Service and our Privacy Policy.'],
      },
      {
        title: 'Orders and Payments',
        body: [
          'Placing an order through the site constitutes an offer to purchase. All orders are subject to acceptance and availability.',
          'Payment must be received before order fulfillment unless cash on delivery is explicitly offered for that order.',
        ],
      },
      {
        title: 'Shipping and Returns',
        body: [
          'Shipping times are estimates and may vary depending on your location and carrier conditions.',
          'Returns, exchanges and refunds follow the policy published on the website and may be subject to conditions and time limits.',
        ],
      },
      {
        title: 'User Accounts',
        body: [
          'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.',
        ],
      },
    ],
    contactTitle: 'Contact Us',
    contactBody: 'For questions about these terms, contact us at support@shoeshoe.vn or call 1900-6092.',
    address: 'Store address: 175 P. Tay Son, Kim Lien, Ha Noi, Viet Nam',
  },
  vi: {
    title: 'Điều khoản dịch vụ',
    sections: [
      {
        title: 'Chấp nhận điều khoản',
        body: ['Khi truy cập hoặc sử dụng ShoeShoe, bạn đồng ý tuân thủ các Điều khoản dịch vụ này cùng với Chính sách quyền riêng tư của chúng tôi.'],
      },
      {
        title: 'Đơn hàng và thanh toán',
        body: [
          'Việc đặt hàng trên website được xem là đề nghị mua hàng. Mọi đơn hàng đều phụ thuộc vào việc xác nhận và tình trạng sẵn có của sản phẩm.',
          'Thanh toán cần được hoàn tất trước khi xử lý đơn hàng, trừ khi đơn đó có hỗ trợ thanh toán khi nhận hàng.',
        ],
      },
      {
        title: 'Vận chuyển và đổi trả',
        body: [
          'Thời gian giao hàng chỉ mang tính ước lượng và có thể thay đổi tùy theo khu vực và đơn vị vận chuyển.',
          'Đổi trả và hoàn tiền được thực hiện theo chính sách được công bố trên website và có thể áp dụng một số điều kiện cũng như thời hạn cụ thể.',
        ],
      },
      {
        title: 'Tài khoản người dùng',
        body: [
          'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình và mọi hoạt động diễn ra trên tài khoản đó.',
        ],
      },
    ],
    contactTitle: 'Liên hệ',
    contactBody: 'Nếu bạn có thắc mắc về các điều khoản này, vui lòng liên hệ support@shoeshoe.vn hoặc gọi 1900-6092.',
    address: 'Địa chỉ cửa hàng: 175 P. Tây Sơn, Kim Liên, Hà Nội, Việt Nam',
  },
};

export default function TermsPage() {
  const { language, t } = useLanguage();
  const page = content[language] || content.en;

  return (
    <main className="privacy-policy-page">
      <Navbar />
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">{t('legal.home')}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{t('legal.termsOfService')}</span>
      </nav>
      <section className="privacy-policy-hero">
        <img src="/logo.png" alt="ShoeShoe" className="privacy-policy-logo" />
        <h1>{page.title}</h1>
      </section>

      <section className="privacy-policy-content" aria-label={page.title}>
        <p className="privacy-policy-updated">{t('legal.lastUpdated')}</p>

        {page.sections.map((section) => (
          <article key={section.title} className="privacy-section">
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}

        <article className="privacy-section privacy-section--contact">
          <h2>{page.contactTitle}</h2>
          <p>{page.contactBody}</p>
          <p>{page.address}</p>
        </article>
      </section>
    </main>
  );
}
