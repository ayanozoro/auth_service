import React from "react";
import { Link } from "react-router-dom";
import { ShieldIcon, LockIcon, ZapIcon, ServerIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-column brand-col">
          <div className="nav-brand">
            <div className="brand-badge small">
              <ShieldIcon size={16} />
            </div>
            <span className="brand-text">
              Auth<span className="brand-highlight">Shield</span>
            </span>
          </div>
          <p className="footer-desc">
            Next-generation authentication infrastructure designed with Redis session caching,
            OTP email validation, and strict HttpOnly cookie security.
          </p>
          <div className="security-badges">
            <span className="sec-tag"><LockIcon size={12} /> HttpOnly Cookies</span>
            <span className="sec-tag"><ZapIcon size={12} /> Redis Rate-Limit</span>
            <span className="sec-tag"><ServerIcon size={12} /> MongoDB User Store</span>
          </div>
        </div>

        <div className="footer-column">
          <h4 className="footer-heading">Navigation</h4>
          <ul className="footer-links">
            <li><Link to="/">Home Overview</Link></li>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Create Account</Link></li>
            <li><Link to="/dashboard">User Dashboard</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="footer-heading">Security Features</h4>
          <ul className="footer-links">
            <li><span>Zod Request Validation</span></li>
            <li><span>6-Digit SMTP OTP Dispatch</span></li>
            <li><span>Dual-Token Silent Refresh</span></li>
            <li><span>Cryptographic Link Verification</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} AuthShield Architecture. All rights reserved.</p>
        <p className="status-live">
          <span className="status-dot-pulsing" /> Backend Protected & Synced
        </p>
      </div>
    </footer>
  );
}
