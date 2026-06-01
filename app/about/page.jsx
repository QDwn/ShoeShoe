import './page.css';

export const metadata = {
  title: 'About — ShoeShoe',
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="about-hero">
        <img src="/about%20us2.png" alt="Dirty Coins" className="about-hero-image" />
      </header>

      <section className="about-content">
        <p className="about-paragraph">
          Dirty Coins is a streetwear brand offering high-quality t-shirts, hoodies, pants, and accessories that blend modern, youthful design with unique street style. We create pieces that help you express identity and stand out, while maintaining durable construction and thoughtful details.
        </p>

        <div className="about-image-wrap">
          <img src="/about%20pic.jpg" alt="Court photo" className="about-illustration" />
        </div>
        <div className="about-image-wrap1">
            Grind Hoops: “Keep Grinding Your Skills, Conquer the Peak” 
        </div>
        <div className="about-image-wrap2">
            In addition to supplying top-tier basketball gear, with a deep passion for the sport, we are also a dedicated cultural hub committed to building a vibrant and supportive basketball ecosystem in Vietnam. From our high-performance products to community events, we stand beside you, helping you train harder and elevate your passion for the game.        </div>
      </section>
    </main>
  );
}
