import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  MailIcon,
  CheckCircleIcon,
} from "./Icons";

export default function VerifyOpt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, login } = useAuth();
  const toast = useToast();

  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(!emailParam);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = useRef([]);

  // Focus the first input box on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Live countdown timer for OTP validity (5 min Redis TTL)
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Handle single character entry
  const handleDigitChange = (index, value) => {
    if (errorMessage) setErrorMessage("");

    // Only allow single numeric character
    const char = value.replace(/[^0-9]/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);

    // Auto-advance to next input if filled
    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-submit if all 6 digits are populated
    if (char && index === 5 && nextDigits.every((d) => d !== "")) {
      executeVerification(email, nextDigits.join(""));
    }
  };

  // Handle Backspace and Arrow navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle pasting full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().replace(/[^0-9]/g, "");
    if (!pastedData) return;

    const chars = pastedData.slice(0, 6).split("");
    const nextDigits = [...digits];
    chars.forEach((c, i) => {
      if (i < 6) nextDigits[i] = c;
    });
    setDigits(nextDigits);

    const focusIndex = Math.min(chars.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }

    if (chars.length === 6) {
      executeVerification(email, chars.join(""));
    }
  };

  const executeVerification = async (targetEmail, otpCode) => {
    if (!targetEmail) {
      setErrorMessage("Please specify the email address receiving the OTP");
      return;
    }
    if (otpCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the OTP code");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await verifyOtp(targetEmail, otpCode);
      setIsSuccess(true);
      toast.success(result?.message || "Verified successfully! Welcome back.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 900);
    } catch (err) {
      const msg = err.message || "Invalid or expired OTP. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeVerification(email, digits.join(""));
  };

  return (
    <div className="auth-split-page">
      {/* Editorial Information Panel */}
      <aside className="auth-editorial-panel">
        <div className="editorial-header">
          <p className="eyebrow">
            <ShieldCheckIcon size={16} />
            Two-Factor Challenge
          </p>
          <h1>
            Verify your <span className="highlight-lime">identity.</span>
          </h1>
          <p className="editorial-lead">
            We dispatched a 6-digit verification passcode to your email inbox.
            This code expires in 5 minutes for your security.
          </p>
        </div>

        <div className="editorial-features">
          <div className="feature-pill">
            <span className="feature-pill-icon"><ClockIcon size={16} /></span>
            <span>Active code validity: 300 seconds</span>
          </div>
          <div className="feature-pill">
            <span className="feature-pill-icon"><KeyIcon size={16} /></span>
            <span>Single-use dynamic cryptographic seed</span>
          </div>
        </div>

        <div className="editorial-footer">
          <span>Encrypted Session Transfer</span>
          <Link to="/login" style={{ color: "var(--accent-lime)", textDecoration: "underline" }}>
            Return to Sign in
          </Link>
        </div>
      </aside>

      {/* Main OTP Entry Card */}
      <main className="auth-form-panel">
        <div className="auth-card-container">
          <div className="auth-form-header">
            <h2>Enter 6-digit Code</h2>
            <p>
              Sent to:{" "}
              {isEditingEmail ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="form-input"
                  style={{ display: "inline-block", width: "auto", height: 32, padding: "0 8px", fontSize: 13, marginTop: 4 }}
                />
              ) : (
                <strong style={{ color: "var(--accent-lime)" }}>{email || "your registered email"}</strong>
              )}
              {" "}
              <button
                type="button"
                onClick={() => setIsEditingEmail(!isEditingEmail)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}
              >
                {isEditingEmail ? "Save" : "Change"}
              </button>
            </p>
          </div>

          {errorMessage && (
            <div className="alert-banner error" role="alert">
              <AlertCircleIcon size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="alert-banner success" role="alert">
              <CheckCircleIcon size={18} />
              <span>Passcode accepted! Redirecting to your dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* 6 Digit Input Boxes */}
            <div className="otp-inputs-grid" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isSubmitting || isSuccess}
                  className={`otp-box ${errorMessage ? "error" : ""}`}
                  aria-label={`Digit ${index + 1}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <div className="otp-meta-row">
              <span className="otp-countdown">
                <ClockIcon size={14} />
                Expires in: <strong>{formatTimer(timeLeft)}</strong>
              </span>
              
              <Link to="/login" className="resend-btn" style={{ textDecoration: "none" }}>
                Back to Login
              </Link>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || isSuccess || digits.some((d) => d === "")}
              style={{ marginTop: 12 }}
            >
              {isSubmitting ? (
                <span>Validating Passcode...</span>
              ) : (
                <>
                  <span>Verify & Sign In</span>
                  <ArrowRightIcon size={18} />
                </>
              )}
            </button>
          </form>

          <p className="form-bottom-link">
            Didn't receive the email? Check your spam folder or{" "}
            <Link to="/login">request a new code</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
