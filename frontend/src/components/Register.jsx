import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "./Icons";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Empty" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    const labels = ["Very Weak", "Fair", "Good", "Strong"];
    return { score, label: labels[score - 1] || "Weak" };
  };

  const strength = calculatePasswordStrength(form.password);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Backend validation alignment
    if (!form.name.trim() || form.name.trim().length < 2) {
      setErrorMessage("Full name must be at least 2 characters long");
      return;
    }

    if (!form.email || !form.email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(form.name.trim(), form.email.trim(), form.password);
      setIsRegistered(true);
      toast.success(res?.message || "Registration email dispatched!");
    } catch (err) {
      const msg = err.message || "Registration failed. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="auth-loading-screen">
        <div className="loading-card" style={{ maxWidth: 480 }}>
          <div className="loading-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}>
            <MailIcon size={32} />
          </div>
          <h2 style={{ marginBottom: 12 }}>Check Your Email</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
            We've sent a verification link to{" "}
            <strong style={{ color: "var(--accent-lime)" }}>{form.email}</strong>.
            Click the link in the message within <strong>5 minutes</strong> to activate your account.
          </p>
          <div className="alert-banner info" style={{ textAlign: "left", marginBottom: 24 }}>
            <span>
              Once you click the link in your email, your account is permanently registered in MongoDB and you can sign in with OTP.
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/login" className="btn-primary">
              Proceed to Sign In
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-split-page">
      {/* Editorial Branding Panel */}
      <aside className="auth-editorial-panel">
        <div className="editorial-header">
          <p className="eyebrow">
            <ShieldCheckIcon size={16} />
            Cryptographic Account Creation
          </p>
          <h1>
            Start building with <span className="highlight-lime">Zero-Trust.</span>
          </h1>
          <p className="editorial-lead">
            Experience next-level security with email token handshakes, bcrypt 10-round salting,
            and automated rate-limiting guards.
          </p>
        </div>

        <div className="editorial-features">
          <div className="feature-pill">
            <span className="feature-pill-icon"><CheckCircleIcon size={16} /></span>
            <span>Cryptographic link verification prevents fake accounts</span>
          </div>
          <div className="feature-pill">
            <span className="feature-pill-icon"><LockIcon size={16} /></span>
            <span>Strict Zod sanitization defends against NoSQL injection</span>
          </div>
        </div>

        <div className="editorial-footer">
          <span>5-Minute Verification TTL</span>
          <span>MongoDB Atlas Cloud</span>
        </div>
      </aside>

      {/* Register Form Card */}
      <main className="auth-form-panel">
        <div className="auth-card-container">
          <div className="auth-form-header">
            <h2>Create an account</h2>
            <p>Enter your details to generate your security credentials</p>
          </div>

          {errorMessage && (
            <div className="alert-banner error" role="alert">
              <AlertCircleIcon size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Full Name field */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full name
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <UserIcon size={18} />
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <MailIcon size={18} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <span className="label-hint">Min 8 characters</span>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <LockIcon size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>

              {/* Password strength visualizer */}
              {form.password && (
                <div className="strength-meter-container">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`strength-bar ${
                          step <= strength.score
                            ? strength.score === 1
                              ? "active-weak"
                              : strength.score === 2
                              ? "active-fair"
                              : strength.score === 3
                              ? "active-good"
                              : "active-strong"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                  <div className="strength-label">
                    <span>Strength: {strength.label}</span>
                    <span>{form.password.length}/8+ chars</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm password
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <LockIcon size={18} />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRightIcon size={18} />
                </>
              )}
            </button>
          </form>

          <p className="form-bottom-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
