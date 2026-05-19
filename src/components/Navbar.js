import './Navbar.css';

export default function Navbar() {

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <img src="/logo.jpg" alt="Logo" />
        <h2>Shoe Store</h2>
      </div>

      {/* Menu */}
      <div className="navbar-menu">
        <a href="/" className="navbar-link">Home</a>

        {/* Products Dropdown */}
        <div className="menu-item">
          <div className="menu-item-label">Products</div>
          <div className="submenu-products">
            <div className="submenu-products-wrapper">
              <div className="submenu-column">
                <h4>Featured</h4>
                <a href="/products?featured=new" className="submenu-item">New Arrivals</a>
                <a href="/products?featured=limited" className="submenu-item">Limited Edition</a>
                <a href="/products?featured=allstar" className="submenu-item">All Star 2026</a>
              </div>
              <div className="submenu-column">
                <h4>Trending</h4>
                <a href="/products?trend=best" className="submenu-item">Best Sellers</a>
                <a href="/products?trend=hot" className="submenu-item">Hot This Week</a>
                <a href="/products?trend=rated" className="submenu-item">Top Rated</a>
              </div>
              <div className="submenu-column">
                <h4>Brand</h4>
                <a href="/products?brand=lebron" className="submenu-item">LeBron</a>
                <a href="/products?brand=curry" className="submenu-item">Curry</a>
                <a href="/products?brand=jordan" className="submenu-item">Jordan</a>
                <a href="/products?brand=lamelo" className="submenu-item">Lamelo</a>
                <a href="/products?brand=sabrina" className="submenu-item">Sabrina</a>
              </div>
              <div className="submenu-column">
                <h4>Categories</h4>
                <a href="/products?category=baseball" className="submenu-item">Baseball Shoes</a>
                <a href="/products?category=jerseys" className="submenu-item">Jerseys</a>
                <a href="/products?category=socks" className="submenu-item">Socks</a>
                <a href="/products?category=accessories" className="submenu-item">Accessories</a>
              </div>
            </div>
          </div>
        </div>

        {/* Man Dropdown */}
        <div className="menu-item">
          <div className="menu-item-label">Man</div>
          <div className="submenu-man">
            <div className="submenu-wrapper">
              <div className="submenu-column">
                <h4>Categories</h4>
                <a href="/man/shoes" className="submenu-item">Shoes</a>
                <a href="/man/boots" className="submenu-item">Boots</a>
                <a href="/man/sandals" className="submenu-item">Sandals</a>
              </div>
              <div className="submenu-column">
                <h4>Style</h4>
                <a href="/man/casual" className="submenu-item">Casual</a>
                <a href="/man/athletic" className="submenu-item">Athletic</a>
                <a href="/man/formal" className="submenu-item">Formal</a>
              </div>
              <div className="submenu-column">
                <h4>Size</h4>
                <a href="/man/size-small" className="submenu-item">Small (6-8)</a>
                <a href="/man/size-medium" className="submenu-item">Medium (9-11)</a>
                <a href="/man/size-large" className="submenu-item">Large (12+)</a>
              </div>
              <div className="submenu-column">
                <h4>Price</h4>
                <a href="/man/budget" className="submenu-item">Under $50</a>
                <a href="/man/standard" className="submenu-item">$50-$100</a>
                <a href="/man/premium" className="submenu-item">$100+</a>
              </div>
            </div>
          </div>
        </div>

        {/* Woman Dropdown */}
        <div className="menu-item">
          <div className="menu-item-label">Woman</div>
          <div className="submenu-woman">
            <div className="submenu-wrapper">
              <div className="submenu-column">
                <h4>Categories</h4>
                <a href="/woman/shoes" className="submenu-item">Shoes</a>
                <a href="/woman/boots" className="submenu-item">Boots</a>
                <a href="/woman/heels" className="submenu-item">Heels</a>
              </div>
              <div className="submenu-column">
                <h4>Style</h4>
                <a href="/woman/casual" className="submenu-item">Casual</a>
                <a href="/woman/athletic" className="submenu-item">Athletic</a>
                <a href="/woman/elegant" className="submenu-item">Elegant</a>
              </div>
              <div className="submenu-column">
                <h4>Size</h4>
                <a href="/woman/size-small" className="submenu-item">Small (5-7)</a>
                <a href="/woman/size-medium" className="submenu-item">Medium (8-10)</a>
                <a href="/woman/size-large" className="submenu-item">Large (11+)</a>
              </div>
              <div className="submenu-column">
                <h4>Price</h4>
                <a href="/woman/budget" className="submenu-item">Under $50</a>
                <a href="/woman/standard" className="submenu-item">$50-$100</a>
                <a href="/woman/premium" className="submenu-item">$100+</a>
              </div>
            </div>
          </div>
        </div>

        <a href="/contact" className="navbar-link">Contact</a>
        <a href="/about" className="navbar-link">About</a>
        <a href="/login" className="navbar-login">Login</a>
        <a href="/register" className="navbar-register">Register</a>
      </div>
    </nav>
  );
}