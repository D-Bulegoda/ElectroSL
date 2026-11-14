import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  // Hidden Admin Login Shortcut (Ctrl + Shift + A or Ctrl + Alt + A)
  useEffect(() => {
    const handleAdminShortcut = (e) => {
      const isCtrlShiftA = e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a';
      const isCtrlAltA = e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a';

      if (isCtrlShiftA || isCtrlAltA) {
        e.preventDefault();
        navigate('/admin-portal/login');
      }
    };

    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, [navigate]);

  return (
    <div className="home-container">
      {/* Top White Navigation Bar */}
      <header className="home-navbar">
        <div className="home-nav-inner">
          <div className="home-brand" onClick={() => navigate('/')}>
            <svg
              className="home-logo-icon"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M13 2L4 14H11L10 22L20 10H13L13 2Z"
                fill="#F59E0B"
                stroke="#D97706"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span className="home-brand-text">ElectroSL</span>
          </div>

          <div className="home-nav-right">
            <nav className="home-nav-links">
              <a href="#how-it-works">How It Works</a>
              <a href="#services">Services</a>
              <a href="#safety">Safety Standards</a>
            </nav>

            <span className="home-nav-divider" />

            <button
              className="btn-customer-login"
              onClick={() => navigate('/customer/home')}
            >
              Customer Login
            </button>

            <button
              className="btn-join-electrician"
              onClick={() => navigate('/electrician/simulator')}
            >
              Join as an Electrician
            </button>
          </div>
        </div>
      </header>

      {/* Navy Blue Hero Section */}
      <section className="home-hero">
        <svg
          className="home-hero-bg-svg"
          viewBox="0 0 1440 500"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M900 50 H1100 L1140 90 V220" stroke="#93C5FD" strokeWidth="2" />
          <circle cx="1140" cy="220" r="5" fill="#93C5FD" />
          <path d="M950 420 H1180 L1220 380 V260" stroke="#93C5FD" strokeWidth="2" />
          <circle cx="950" cy="420" r="5" fill="#93C5FD" />
        </svg>

        <div className="home-hero-inner">
          <div>
            <h1 className="home-hero-title">
              Certified Electricians
              <br />
              at Your Doorstep
            </h1>

            <p className="home-hero-subtitle">
              Fast, safe, and verified electrical services in Sri Lanka with live GPS
              tracking and transparent pricing.
            </p>

            <div className="home-hero-actions">
              <button
                className="btn-post-job"
                onClick={() => navigate('/customer/post-job')}
              >
                Post a Job Now
              </button>

              <button
                className="btn-electrician-auth"
                onClick={() => navigate('/electrician/dashboard')}
              >
                Electrician Sign Up / Login
              </button>
            </div>
          </div>

          <div className="home-hero-art">
            <svg
              className="home-hero-svg"
              width="400"
              height="340"
              viewBox="0 0 420 360"
              fill="none"
            >
              {/* Circuit Trace Lines */}
              <path
                d="M70 90 H120 L140 110 V190 H90"
                stroke="#3B6998"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="70" cy="90" r="4" fill="#3B6998" />
              <circle cx="90" cy="190" r="4" fill="#3B6998" />
              <path
                d="M60 140 H105 L120 155 V240"
                stroke="#3B6998"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="60" cy="140" r="4" fill="#3B6998" />

              {/* Map Card Top-Right */}
              <rect
                x="280"
                y="45"
                width="95"
                height="75"
                rx="10"
                fill="#1D4473"
                stroke="#4A7BB0"
                strokeWidth="2"
              />
              <path
                d="M285 95 L325 70 L370 100 M315 50 L340 115"
                stroke="#6495C9"
                strokeWidth="2"
              />
              <path
                d="M325 32 C313 32 304 41 304 53 C304 68 325 86 325 86 C325 86 346 68 346 53 C346 41 337 32 325 32 Z"
                fill="#F59E0B"
                stroke="#0B2240"
                strokeWidth="2.5"
              />
              <circle cx="325" cy="52" r="7" fill="#0B2240" />

              {/* GPS Radar Badge */}
              <circle
                cx="355"
                cy="170"
                r="28"
                fill="#163760"
                stroke="#4A7BB0"
                strokeWidth="2"
              />
              <circle cx="355" cy="170" r="19" stroke="#F59E0B" strokeWidth="2" />
              <path
                d="M348 175 L363 163 L357 179 L354 173 L348 175 Z"
                fill="#F59E0B"
              />
              <text
                x="355"
                y="214"
                textAnchor="middle"
                fill="#93C5FD"
                fontSize="11"
                fontWeight="bold"
              >
                GPS
              </text>

              {/* Electrician Body */}
              <path
                d="M155 170 C155 150 175 140 215 140 C255 140 275 150 275 170 L285 280 H145 L155 170 Z"
                fill="#1E497A"
                stroke="#08182E"
                strokeWidth="3"
              />

              {/* High-Vis Safety Vest */}
              <path
                d="M175 142 L195 142 L205 205 L170 205 Z"
                fill="#F59E0B"
                stroke="#08182E"
                strokeWidth="2.5"
              />
              <path
                d="M255 142 L235 142 L225 205 L260 205 Z"
                fill="#F59E0B"
                stroke="#08182E"
                strokeWidth="2.5"
              />
              <rect x="172" y="175" width="28" height="8" fill="#E2E8F0" />
              <rect x="230" y="175" width="28" height="8" fill="#E2E8F0" />

              {/* Tool Belt */}
              <rect
                x="155"
                y="265"
                width="120"
                height="22"
                rx="4"
                fill="#D97706"
                stroke="#08182E"
                strokeWidth="2.5"
              />
              <rect
                x="203"
                y="263"
                width="24"
                height="26"
                rx="3"
                fill="#94A3B8"
                stroke="#08182E"
                strokeWidth="2.5"
              />
              <rect
                x="152"
                y="272"
                width="34"
                height="45"
                rx="5"
                fill="#B45309"
                stroke="#08182E"
                strokeWidth="2.5"
              />
              <rect
                x="244"
                y="272"
                width="34"
                height="45"
                rx="5"
                fill="#B45309"
                stroke="#08182E"
                strokeWidth="2.5"
              />

              {/* Head & Face */}
              <rect x="204" y="122" width="22" height="22" rx="6" fill="#FDBA74" />
              <path
                d="M188 92 C188 72 242 72 242 92 V108 C242 123 230 132 215 132 C200 132 188 123 188 108 V92 Z"
                fill="#FDBA74"
                stroke="#08182E"
                strokeWidth="2.5"
              />
              <circle cx="206" cy="103" r="2.5" fill="#08182E" />
              <circle cx="225" cy="103" r="2.5" fill="#08182E" />
              <path
                d="M209 115 Q216 121 223 115"
                stroke="#08182E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Hard Hat */}
              <path
                d="M183 86 C183 62 247 62 247 86 H183 Z"
                fill="#F59E0B"
                stroke="#08182E"
                strokeWidth="2.5"
              />
              <path
                d="M176 86 H254"
                stroke="#F59E0B"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M176 86 H254"
                stroke="#08182E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Tablet & Gloves */}
              <g transform="rotate(-10 185 215)">
                <rect
                  x="130"
                  y="190"
                  width="95"
                  height="65"
                  rx="8"
                  fill="#CBD5E1"
                  stroke="#08182E"
                  strokeWidth="2.5"
                />
                <rect x="137" y="197" width="81" height="51" rx="4" fill="#94A3B8" />
              </g>
              <circle
                cx="142"
                cy="232"
                r="11"
                fill="#475569"
                stroke="#08182E"
                strokeWidth="2.5"
              />
              <circle
                cx="228"
                cy="222"
                r="11"
                fill="#475569"
                stroke="#08182E"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* White Features Section */}
      <section id="services" className="home-features">
        <div className="home-features-inner">
          <h2 className="home-section-heading">Why Choose ElectroSL?</h2>

          <div className="home-cards-grid">
            {/* Card 1 */}
            <div id="safety" className="home-feature-card">
              <svg
                className="home-card-icon"
                width="110"
                height="76"
                viewBox="0 0 120 80"
                fill="none"
              >
                <circle cx="32" cy="34" r="18" fill="#0F294A" />
                <circle cx="32" cy="34" r="11" fill="#F59E0B" />
                <path
                  d="M27 34 L31 38 L38 30"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M24 50 L20 66 L32 60 L44 66 L40 50" fill="#0F294A" />
                <rect
                  x="58"
                  y="16"
                  width="54"
                  height="44"
                  rx="6"
                  fill="#FFFFFF"
                  stroke="#0F294A"
                  strokeWidth="2.5"
                />
                <path d="M58 26 H112" stroke="#0F294A" strokeWidth="2.5" />
                <rect x="65" y="34" width="16" height="14" rx="2" fill="#F59E0B" />
                <text
                  x="73"
                  y="44"
                  textAnchor="middle"
                  fill="#0F294A"
                  fontSize="8"
                  fontWeight="bold"
                >
                  2D
                </text>
                <path
                  d="M81 38 H96 V33 H104 M81 44 H94 V50 H104"
                  stroke="#0F294A"
                  strokeWidth="2"
                />
                <circle cx="104" cy="33" r="2.5" fill="#0F294A" />
                <circle cx="104" cy="50" r="2.5" fill="#0F294A" />
              </svg>
              <h3 className="home-card-title">
                NVQ &amp; Simulator
                <br />
                Verified Pros
              </h3>
              <p className="home-card-desc">
                Practical 230V 2D circuit testing before taking customer jobs.
              </p>
            </div>

            {/* Card 2 */}
            <div id="how-it-works" className="home-feature-card">
              <svg
                className="home-card-icon"
                width="110"
                height="76"
                viewBox="0 0 120 80"
                fill="none"
              >
                <path
                  d="M26 68 L36 52 H84 L94 68 H26 Z"
                  fill="#FEF3C7"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path d="M44 52 L38 68 M76 52 L82 68" stroke="#F59E0B" strokeWidth="2" />
                <path
                  d="M36 22 C30 28 30 38 36 44 M29 16 C20 25 20 41 29 50"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M84 22 C90 28 90 38 84 44 M91 16 C100 25 100 41 91 50"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M60 12 C48 12 40 20 40 31 C40 45 60 62 60 62 C60 62 80 45 80 31 C80 20 72 12 60 12 Z"
                  fill="#0F294A"
                />
                <circle cx="60" cy="31" r="8" fill="#FFFFFF" />
              </svg>
              <h3 className="home-card-title">
                Live GPS Technician
                <br />
                Tracking
              </h3>
              <p className="home-card-desc">
                Track your technician’s arrival route and ETA in real time.
              </p>
            </div>

            {/* Card 3 */}
            <div className="home-feature-card">
              <svg
                className="home-card-icon"
                width="110"
                height="76"
                viewBox="0 0 120 80"
                fill="none"
              >
                <path
                  d="M35 28 C30 34 30 44 35 50 M28 22 C20 31 20 47 28 56"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M85 28 C90 34 90 44 85 50 M92 22 C100 31 100 47 92 56"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path d="M60 12 V17" stroke="#0F294A" strokeWidth="3" strokeLinecap="round" />
                <path
                  d="M42 54 V36 C42 26 50 18 60 18 C70 18 78 26 78 36 V54 H42 Z"
                  fill="#0F294A"
                />
                <rect x="58" y="27" width="4" height="14" rx="2" fill="#FFFFFF" />
                <circle cx="60" cy="46" r="2.2" fill="#FFFFFF" />
                <rect x="37" y="56" width="46" height="6" rx="3" fill="#0F294A" />
              </svg>
              <h3 className="home-card-title">24/7 Emergency SOS</h3>
              <p className="home-card-desc">
                Instant dispatch for power trips, short circuits, and hazards.
              </p>
            </div>

            {/* Card 4 */}
            <div className="home-feature-card">
              <svg
                className="home-card-icon"
                width="110"
                height="76"
                viewBox="0 0 120 80"
                fill="none"
              >
                <path
                  d="M22 30 L38 16 L54 30"
                  fill="#E2E8F0"
                  stroke="#0F294A"
                  strokeWidth="2.2"
                />
                <rect x="16" y="28" width="44" height="34" rx="6" fill="#0F294A" />
                <rect x="44" y="39" width="18" height="12" rx="3" fill="#F59E0B" />
                <circle cx="50" cy="45" r="2" fill="#0F294A" />
                <rect
                  x="66"
                  y="16"
                  width="38"
                  height="48"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#0F294A"
                  strokeWidth="2.5"
                />
                <circle cx="77" cy="27" r="5" fill="#F59E0B" />
                <path
                  d="M86 25 H97 M73 38 H97 M73 45 H97 M73 52 H88"
                  stroke="#0F294A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <h3 className="home-card-title">
                Transparent Digital
                <br />
                Wallet &amp; Quotes
              </h3>
              <p className="home-card-desc">
                Compare upfront bids and standardized equipment prices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Navy Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-left">
            <span>© 2026 ElectroSL. All rights reserved.</span>
            <a href="#safety">Safety Policy</a>
            <a href="#services">Terms of Service</a>
          </div>
          <span>230V AC Certified Service Network</span>
        </div>
      </footer>
    </div>
  );
}