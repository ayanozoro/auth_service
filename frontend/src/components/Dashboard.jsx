import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { refreshToken, getMyProfile } from "../services/api";
import {
  ShieldCheckIcon,
  UserIcon,
  LockIcon,
  LogOutIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  ServerIcon,
  ClockIcon,
  KeyIcon,
  ZapIcon,
  MailIcon,
} from "./Icons";

export default function Dashboard({ defaultTab = "overview" }) {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [copiedField, setCopiedField] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLog, setRefreshLog] = useState(null);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.info("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout encounter an error. Session cleared.");
      navigate("/login");
    }
  };

  // Test silent token refresh live against backend
  const handleTestTokenRefresh = async () => {
    setIsRefreshing(true);
    setRefreshLog("Contacting /api/refresh-token with HttpOnly cookies...");

    try {
      const refreshed = await refreshToken();
      if (!refreshed) {
        throw new Error("Backend rejected refresh token (cookie expired or missing)");
      }
      setRefreshLog("Access token refreshed! Verifying session via /api/myprofile...");

      const profileData = await getMyProfile();
      if (profileData?.user) {
        setUser(profileData.user);
        setRefreshLog("Success! Session validated and updated via Redis user cache.");
        toast.success("Token refreshed and session verified successfully!");
      }
    } catch (err) {
      setRefreshLog(`Refresh failed: ${err.message}`);
      toast.error(err.message || "Failed to refresh token");
    } finally {
      setIsRefreshing(false);
    }
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Authorized User";
  const userRole = user?.role || "user";
  const userId = user?._id || user?.id || "Unavailable";
  const userEmail = user?.email || "Unavailable";
  const createdAtFormatted = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Active Session";

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar Navigation */}
      <aside className="dash-sidebar">
        <div className="dash-nav-section">
          <p className="dash-nav-label">Navigation</p>
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <ShieldCheckIcon size={18} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <UserIcon size={18} />
            <span>Profile Data</span>
          </button>
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <LockIcon size={18} />
            <span>Security & Tokens</span>
          </button>
        </div>

        <div className="dash-nav-section">
          <button
            type="button"
            className="dash-tab-btn"
            onClick={handleLogout}
            style={{ color: "var(--accent-rose)" }}
          >
            <LogOutIcon size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dash-main">
        {/* Welcome Header */}
        <header className="dash-header">
          <div className="dash-welcome">
            <p className="eyebrow" style={{ color: "var(--accent-lime)" }}>
              Authenticated Session
            </p>
            <h1>Welcome back, {displayName}</h1>
            <p>Your identity is verified and protected under Redis session tracking.</p>
          </div>

          <div className="dash-user-card">
            <div className="dash-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{displayName}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{userEmail}</div>
            </div>
            <span className="brand-status-tag" style={{ marginLeft: 6 }}>
              {userRole}
            </span>
          </div>
        </header>

        {/* Top Key Metrics */}
        <section className="dash-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}>
              <ShieldCheckIcon size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Security Status</p>
              <h3 className="stat-value">Hardened</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: "rgba(207, 223, 114, 0.15)", color: "var(--accent-lime)" }}>
              <KeyIcon size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Two-Factor Authentication</p>
              <h3 className="stat-value">OTP Verified</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: "rgba(56, 189, 248, 0.15)", color: "var(--accent-cyan)" }}>
              <ZapIcon size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Session Storage</p>
              <h3 className="stat-value">Redis Cluster</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)" }}>
              <ClockIcon size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Access Token TTL</p>
              <h3 className="stat-value">5 Minutes</h3>
            </div>
          </div>
        </section>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="dash-grid-2col">
            <div className="dash-panel-card">
              <div className="panel-header">
                <h3>
                  <UserIcon size={18} />
                  Account Summary
                </h3>
                <span className="brand-status-tag">Verified</span>
              </div>
              <div className="data-row-list">
                <div className="data-row">
                  <span className="data-key">Display Name</span>
                  <span className="data-val">{displayName}</span>
                </div>
                <div className="data-row">
                  <span className="data-key">Email Address</span>
                  <span className="data-val">
                    {userEmail}
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={() => handleCopy(userEmail, "Email")}
                      title="Copy email"
                    >
                      {copiedField === "Email" ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    </button>
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-key">System Role</span>
                  <span className="data-val">{userRole.toUpperCase()}</span>
                </div>
                <div className="data-row">
                  <span className="data-key">Account Member Since</span>
                  <span className="data-val">{createdAtFormatted}</span>
                </div>
              </div>
            </div>

            <div className="dash-panel-card">
              <div className="panel-header">
                <h3>
                  <ZapIcon size={18} />
                  Quick Actions
                </h3>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
                Perform administrative checks and verify session integrity in real time.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleTestTokenRefresh}
                  disabled={isRefreshing}
                  style={{ justifyContent: "flex-start" }}
                >
                  <RefreshIcon size={18} className={isRefreshing ? "pulse-icon" : ""} />
                  <span>{isRefreshing ? "Testing Token Refresh..." : "Test Silent Token Refresh"}</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveTab("profile")}
                  style={{ justifyContent: "flex-start" }}
                >
                  <UserIcon size={18} />
                  <span>Inspect Full Profile Metadata</span>
                </button>
              </div>

              {refreshLog && (
                <div
                  className="alert-banner info"
                  style={{ marginTop: 20, fontSize: 12, fontFamily: "var(--font-mono)" }}
                >
                  {refreshLog}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Profile */}
        {activeTab === "profile" && (
          <div className="dash-panel-card">
            <div className="panel-header">
              <h3>
                <UserIcon size={18} />
                Detailed Profile Record
              </h3>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => handleCopy(userId, "User ID")}
              >
                {copiedField === "User ID" ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                <span>Copy User ID</span>
              </button>
            </div>

            <div className="data-row-list">
              <div className="data-row">
                <span className="data-key">Database Document ID (_id)</span>
                <span className="data-val" style={{ wordBreak: "break-all" }}>
                  {userId}
                </span>
              </div>
              <div className="data-row">
                <span className="data-key">Full Name</span>
                <span className="data-val">{displayName}</span>
              </div>
              <div className="data-row">
                <span className="data-key">Email Address</span>
                <span className="data-val">{userEmail}</span>
              </div>
              <div className="data-row">
                <span className="data-key">Access Level</span>
                <span className="data-val">{userRole}</span>
              </div>
              <div className="data-row">
                <span className="data-key">Password Hash Protocol</span>
                <span className="data-val">Bcrypt (Salt Rounds: 10, Redacted)</span>
              </div>
              <div className="data-row">
                <span className="data-key">Cached In Redis</span>
                <span className="data-val">Yes (TTL: 3600 seconds)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Tokens */}
        {activeTab === "security" && (
          <div className="dash-grid-2col">
            <div className="dash-panel-card">
              <div className="panel-header">
                <h3>
                  <LockIcon size={18} />
                  Token Lifecycle & Defense
                </h3>
              </div>
              <div className="data-row-list">
                <div className="data-row">
                  <span className="data-key">Access Token</span>
                  <span className="data-val">5 min • HttpOnly Cookie</span>
                </div>
                <div className="data-row">
                  <span className="data-key">Refresh Token</span>
                  <span className="data-val">24 hr • HttpOnly Cookie</span>
                </div>
                <div className="data-row">
                  <span className="data-key">Redis Session Invalidation</span>
                  <span className="data-val">On Logout & Revocation</span>
                </div>
                <div className="data-row">
                  <span className="data-key">Rate Limit Threshold</span>
                  <span className="data-val">Active per IP & Email</span>
                </div>
              </div>
            </div>

            <div className="dash-panel-card">
              <div className="panel-header">
                <h3>
                  <RefreshIcon size={18} />
                  Live Token Refresh Simulation
                </h3>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
                Trigger a manual refresh call to test if your browser's HttpOnly refresh cookie
                smoothly renews your session without requiring you to re-type your password.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleTestTokenRefresh}
                disabled={isRefreshing}
                style={{ width: "100%" }}
              >
                <RefreshIcon size={16} className={isRefreshing ? "pulse-icon" : ""} />
                <span>{isRefreshing ? "Executing Silent Refresh..." : "Execute Token Refresh Test"}</span>
              </button>

              {refreshLog && (
                <div
                  className="alert-banner info"
                  style={{ marginTop: 16, fontSize: 13, fontFamily: "var(--font-mono)" }}
                >
                  {refreshLog}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}