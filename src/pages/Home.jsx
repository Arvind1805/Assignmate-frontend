import "./Home.css";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="landing-dark">

      {/* ============ HERO ============ */}
      <section className="hero-dark">
        <div className="hero-content">

          <div className="hero-left">
            <h1>
              Smarter Assignments,  
              <span> Powered by AI.</span>
            </h1>

            <p>
              AssignMate connects students with expert writers using intelligent matching,
              real-time collaboration, and a seamless workflow — all in one place.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="hero-btn-primary">Get Started</Link>
              <Link to="/login" className="hero-btn-secondary">Login</Link>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-graphic"></div>
          </div>

        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="features-dark">
        <h2 className="section-title">Powerful Features</h2>

        <div className="features-grid">
          <div className="feature-card">
            <i className="ri-chat-1-line"></i>
            <h3>Real-Time Chat</h3>
            <p>Communicate instantly with writers using live messaging.</p>
          </div>

          <div className="feature-card">
            <i className="ri-user-star-line"></i>
            <h3>Top Writers</h3>
            <p>Work with verified, highly-rated experts across subjects.</p>
          </div>

          <div className="feature-card">
            <i className="ri-file-edit-line"></i>
            <h3>Easy Requests</h3>
            <p>Submit assignment details with one click and get quick responses.</p>
          </div>

          <div className="feature-card">
            <i className="ri-shield-check-line"></i>
            <h3>Secure Platform</h3>
            <p>Encrypted communication and transparent workflows.</p>
          </div>
        </div>
      </section>

      {/* ============ WHY ASSIGNMATE ============ */}
      <section className="why-dark">
        <h2 className="section-title">Why AssignMate?</h2>

        <div className="why-content">
          <div className="why-box">
            <i className="ri-rocket-line"></i>
            <h3>Lightning Fast</h3>
            <p>Writers respond quickly and deliver on time.</p>
          </div>

          <div className="why-box">
            <i className="ri-lightbulb-flash-line"></i>
            <h3>AI-Powered Match</h3>
            <p>Smart algorithms pick the right writer for your subject.</p>
          </div>

          <div className="why-box">
            <i className="ri-price-tag-3-line"></i>
            <h3>Best Pricing</h3>
            <p>Transparent and affordable rates. No hidden fees.</p>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="faq-dark">
        <h2 className="section-title">Frequently Asked Questions</h2>

        <div className="faq-list">
          <div className="faq-item">
            <h3>How does AssignMate work?</h3>
            <p>Submit your request → Writers reply → You collaborate → Done.</p>
          </div>

          <div className="faq-item">
            <h3>Is AssignMate free?</h3>
            <p>Yes, registration is completely free.</p>
          </div>

          <div className="faq-item">
            <h3>Are writers verified?</h3>
            <p>All writers undergo profile checks and rating evaluations.</p>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer-dark">
        <p>© {new Date().getFullYear()} AssignMate. All rights reserved.</p>
      </footer>
    </div>
  );
}
