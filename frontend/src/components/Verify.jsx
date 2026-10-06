import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  RefreshIcon,
} from "./Icons";

export default function Verify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { verifyEmailToken } = useAuth();
  const toast = useToast();

  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState(null);
  
  // Guard against React 18/19 StrictMode double-invoking
  const hasCalled = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the URL.");
      return;
    }

    if (hasCalled.current) return;
    hasCalled.current = true;

    const performVerification = async () => {
      try {
        const res = await verifyEmailToken(token);
        setStatus("success");
        setMessage(res?.message || "User verified and registered successfully!");
        setUserData(res?.user || null);
        toast.success("Account successfully verified!");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Invalid or expired verification token.");
        toast.error(err.message || "Verification failed");
      }
    };

    performVerification();
  }, [token, verifyEmailToken, toast]);

  return (
    <div className="auth-loading-screen">
      <div className="loading-card" style={{ maxWidth: 460 }}>
        {status === "verifying" && (
          <>
            <div className="loading-icon-wrapper">
              <ShieldCheckIcon size={32} className="pulse-icon" />
            </div>
            <h2>Verifying Account</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
              Validating your cryptographic token with the authentication cluster...
            </p>
            <div className="loading-bar">
              <div className="loading-bar-fill" />
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className="loading-icon-wrapper"
              style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}
            >
              <CheckCircleIcon size={36} />
            </div>
            <h2>Account Verified!</h2>
            <p style={{ color: "var(--text-secondary)", margin: "12px 0 24px" }}>
              {message}
              {userData?.name && (
                <span> Welcome aboard, <strong>{userData.name}</strong>!</span>
              )}
            </p>
            <Link to="/login" className="btn-primary" style={{ width: "100%" }}>
              Sign In to Your Account
              <ArrowRightIcon size={16} />
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className="loading-icon-wrapper"
              style={{ background: "rgba(244, 63, 94, 0.15)", color: "var(--accent-rose)" }}
            >
              <AlertCircleIcon size={36} />
            </div>
            <h2>Verification Failed</h2>
            <p style={{ color: "var(--text-secondary)", margin: "12px 0 24px" }}>
              {message || "The verification link may have expired (links expire after 5 minutes) or has already been used."}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link to="/register" className="btn-primary">
                Register Again
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
