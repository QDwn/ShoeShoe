'use client';

import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import { useLanguage } from '../../src/context/LanguageContext';
import './page.css';

const content = {
  en: {
    title: 'Privacy Policy',
    intro: [
      'ShoeShoe operates this store and website, including all related information, content, features, tools, products and services, in order to provide you with a curated shopping experience. This Privacy Policy explains how we collect, use, and disclose your personal information when you visit, use, or make a purchase from our website or communicate with us.',
      'Please read this Privacy Policy carefully. By using and accessing the website, you acknowledge that you have read this Privacy Policy and understand the collection, use, and disclosure of your information as described here.',
    ],
    sections: [
      {
        title: 'Personal Information We Collect',
        body: [
          'We collect information you provide when you create an account, place an order, sign up for emails, contact support, or join a promotion.',
          'This may include your name, email address, phone number, shipping address, billing details, and account credentials.',
        ],
      },
      {
        title: 'How We Use Your Information',
        body: [
          'We use your information to process orders, deliver products, manage returns, respond to support requests, and personalize your shopping experience.',
          'We may also use your information to prevent fraud, troubleshoot issues, analyze store performance, and send marketing messages when you choose to receive them.',
        ],
      },
      {
        title: 'Data Security and Retention',
        body: [
          'We use reasonable technical and organizational safeguards to protect your information, but no online system can be guaranteed to be completely secure.',
          'We keep personal information only as long as needed for the purposes described in this policy, to comply with legal obligations, resolve disputes, and maintain business records.',
        ],
      },
    ],
    contactTitle: 'Contact Us',
    contactBody: 'If you have questions about this policy or how your information is handled, please contact us at grindhoops@gmail.com or call +84 333 657 424.',
    address: 'Store address: 175 P. Tay Son, Kim Lien, Ha Noi, Viet Nam',
  },
  vi: {
    title: 'Chính sách quyền riêng tư',
    intro: [
      'ShoeShoe vận hành cửa hàng và website này, bao gồm toàn bộ thông tin, nội dung, tính năng, công cụ, sản phẩm và dịch vụ liên quan nhằm mang đến cho bạn trải nghiệm mua sắm hoàn chỉnh. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và chia sẻ dữ liệu cá nhân khi bạn truy cập, sử dụng hoặc mua hàng trên website.',
      'Vui lòng đọc kỹ Chính sách quyền riêng tư này. Khi sử dụng website, bạn xác nhận rằng mình đã đọc và hiểu cách chúng tôi thu thập, sử dụng và công bố thông tin như mô tả tại đây.',
    ],
    sections: [
      {
        title: 'Thông tin cá nhân chúng tôi thu thập',
        body: [
          'Chúng tôi thu thập thông tin bạn cung cấp khi tạo tài khoản, đặt hàng, đăng ký nhận email, liên hệ hỗ trợ hoặc tham gia chương trình khuyến mãi.',
          'Thông tin này có thể bao gồm họ tên, email, số điện thoại, địa chỉ giao hàng, thông tin thanh toán và thông tin đăng nhập tài khoản.',
        ],
      },
      {
        title: 'Cách chúng tôi sử dụng thông tin của bạn',
        body: [
          'Chúng tôi sử dụng thông tin của bạn để xử lý đơn hàng, giao sản phẩm, quản lý đổi trả, hỗ trợ khách hàng và cá nhân hóa trải nghiệm mua sắm.',
          'Ngoài ra, chúng tôi có thể sử dụng thông tin để phòng chống gian lận, xử lý sự cố, phân tích hiệu quả hoạt động cửa hàng và gửi thông tin tiếp thị khi bạn đồng ý nhận.',
        ],
      },
      {
        title: 'Bảo mật và thời gian lưu trữ dữ liệu',
        body: [
          'Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức hợp lý để bảo vệ thông tin của bạn, tuy nhiên không có hệ thống trực tuyến nào an toàn tuyệt đối.',
          'Chúng tôi chỉ lưu giữ dữ liệu cá nhân trong khoảng thời gian cần thiết để phục vụ các mục đích nêu trong chính sách này, đáp ứng yêu cầu pháp lý và lưu hồ sơ kinh doanh.',
        ],
      },
    ],
    contactTitle: 'Liên hệ',
    contactBody: 'Nếu bạn có câu hỏi về chính sách này hoặc cách dữ liệu của bạn được xử lý, vui lòng liên hệ grindhoops@gmail.com hoặc gọi +84 333 657 424.',
    address: 'Địa chỉ cửa hàng: 175 P. Tây Sơn, Kim Liên, Hà Nội, Việt Nam',
  },
};

export default function PrivacyPolicyPage() {
  const { language, t } = useLanguage();
  const page = content[language] || content.en;

  return (
    <main className="privacy-policy-page">
      <Navbar />
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">{t('legal.home')}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{t('legal.privacyPolicy')}</span>
      </nav>
      <section className="privacy-policy-hero">
        <img src="/logo.png" alt="ShoeShoe" className="privacy-policy-logo" />
        <h1>{page.title}</h1>
      </section>

      <section className="privacy-policy-content" aria-label={page.title}>
        <p className="privacy-policy-updated">{t('legal.lastUpdated')}</p>

        {page.intro.map((paragraph) => (
          <p key={paragraph} className="privacy-policy-intro">{paragraph}</p>
        ))}

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
