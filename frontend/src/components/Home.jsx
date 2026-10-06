import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheckIcon,
  LockIcon,
  ZapIcon,
  KeyIcon,
  MailIcon,
  ServerIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "./Icons";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-view">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <SparklesIcon size={14} />
          <span>Zero-Trust Architecture • Redis Session Engine</span>
        </div>

        <h1 className="hero-title">
          Next-Generation Authentication Hardened for the Modern Web
        </h1>

        <p className="hero-description">
          Engineered with cryptographic email verification, two-factor OTP dispatch via SMTP,
          Redis-backed rate limiting, and dual HttpOnly cookie sessions.
        </p>

        <div className="hero-cta-group">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              Open Dashboard
              <ArrowRightIcon size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">
                Get Started
                <ArrowRightIcon size={18} />
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign In to Account
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Security Architecture Flow */}
      <section className="arch-section">
        <p className="section-eyebrow">Enterprise Security Lifecycle</p>
        <h2 className="section-title">How AuthShield Protects Every Request</h2>

        <div className="arch-steps-grid">
          <div className="arch-card">
            <span className="arch-step-num">01</span>
            <div className="arch-card-icon">
              <MailIcon size={24} />
            </div>
            <h3>Email Verification</h3>
            <p>
              New accounts undergo mandatory cryptographic link verification. Verification tokens
              are preserved in Redis with a 5-minute strict TTL before persisting to MongoDB.
            </p>
          </div>

          <div className="arch-card">
            <span className="arch-step-num">02</span>
            <div className="arch-card-icon">
              <KeyIcon size={24} />
            </div>
            <h3>Two-Factor OTP</h3>
            <p>
              Every password authentication triggers a dynamic 6-digit one-time passcode sent directly
              to the verified inbox, eliminating credential-stuffing vulnerabilities.
            </p>
          </div>

          <div className="arch-card">
            <span className="arch-step-num">03</span>
            <div className="arch-card-icon">
              <ZapIcon size={24} />
            </div>
            <h3>Redis Rate Limiter</h3>
            <p>
              Granular rate limiting tracks IP and email hashes on both registration and login routes,
              preventing brute-force attempts and denial-of-service spikes.
            </p>
          </div>

          <div className="arch-card">
            <span className="arch-step-num">04</span>
            <div className="arch-card-icon">
              <LockIcon size={24} />
            </div>
            <h3>HttpOnly Cookie Sessions</h3>
            <p>
              Dual JWT architecture separates 5-minute access tokens from 24-hour refresh tokens in
              SameSite Strict cookies, impenetrable to client-side XSS attacks.
            </p>
          </div>
        </div>
      </section>

      {/* Security Specs Section */}
      <section className="arch-section" style={{ paddingTop: 0 }}>
        <div className="dash-panel-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
          <div className="panel-header" style={{ borderBottomColor: "var(--border-subtle)" }}>
            <h3>
              <ShieldCheckIcon size={20} style={{ color: "var(--accent-lime)" }} />
              Active System Specifications
            </h3>
            <span className="brand-status-tag">Audit Grade</span>
          </div>

          <div className="data-row-list">
            <div className="data-row">
              <span className="data-key">Password Hashing Algorithm</span>
              <span className="data-val">Bcrypt (Salt Rounds: 10)</span>
            </div>
            <div className="data-row">
              <span className="data-key">Input Sanitization</span>
              <span className="data-val">Mongo-Sanitize + Zod Schema</span>
            </div>
            <div className="data-row">
              <span className="data-key">Session Cache Store</span>
              <span className="data-val">Redis Upstash In-Memory Cluster</span>
            </div>
            <div className="data-row">
              <span className="data-key">Database Store</span>
              <span className="data-val">MongoDB Atlas M0 Replica Set</span>
            </div>
            <div className="data-row">
              <span className="data-key">Two-Factor Passcode Lifespan</span>
              <span className="data-val">300 Seconds (5 Minutes)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
