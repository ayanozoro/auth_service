import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  LockIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  KeyIcon,
} from "./Icons";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Client-side validations matching backend Zod schema
    if (!form.email || !form.email.includes("@")) {
      setErrorMessage("Please provide a valid email address");
      return;
    }

    if (!form.password || form.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(form.email, form.password);
      toast.success(result?.message || "OTP code sent to your email!");
      // Proceed to OTP verification step with email in query param
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      const msg = err.message || "Login failed. Please check your credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-split-page">
      {/* Editorial Branding Panel */}
      <aside className="auth-editorial-panel">
        <div className="editorial-header">
          <p className="eyebrow">
            <ShieldCheckIcon size={16} />
            Two-Factor Protected Access
          </p>
          <h1>
            Secure sign in with <span className="highlight-lime">Zero-Trust OTP.</span>
          </h1>
          <p className="editorial-lead">
            Every authentication is protected with dynamic one-time passcodes and rate-limited
            sessions to keep your account safe from unauthorized intrusion.
          </p>
        </div>

        <div className="editorial-features">
          <div className="feature-pill">
            <span className="feature-pill-icon"><KeyIcon size={16} /></span>
            <span>Automatic 6-digit OTP delivery to inbox</span>
          </div>
          <div className="feature-pill">
            <span className="feature-pill-icon"><LockIcon size={16} /></span>
            <span>HttpOnly SameSite Strict session cookies</span>
          </div>
        </div>

        <div className="editorial-footer">
          <span>Protected by Redis In-Memory Engine</span>
          <span>AES-256 Protocol</span>
        </div>
      </aside>

      {/* Form Card Panel */}
      <main className="auth-form-panel">
        <div className="auth-card-container">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Enter your credentials to initiate secure login</p>
          </div>

          {errorMessage && (
            <div className="alert-banner error" role="alert">
              <AlertCircleIcon size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
                  className={`form-input ${errorMessage && !form.email ? "error" : ""}`}
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                <>
                  <span>Continue to 2FA</span>
                  <ArrowRightIcon size={18} />
                </>
              )}
            </button>
          </form>

          <p className="form-bottom-link">
            Don't have an account yet? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}