import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ShieldCheckIcon, LogOutIcon, UserIcon } from "./Icons";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.info("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="site-header">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <div className="brand-badge">
            <ShieldCheckIcon size={20} />
          </div>
          <span className="brand-text">
            Auth<span className="brand-highlight">Shield</span>
          </span>
          <span className="brand-status-tag">Enterprise</span>
        </Link>

        {/* Navigation Links */}
        <nav className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
          <Link
            to="/"
            className={`nav-link ${isActive("/") ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Overview
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* Auth CTA Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-user-cluster">
              <Link to="/dashboard" className="nav-user-pill">
                <span className="avatar-chip">
                  {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                </span>
                <span className="nav-user-name">{user?.name || user?.email}</span>
                <span className="nav-role-badge">{user?.role || "user"}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="nav-logout-btn"
                title="Log out"
              >
                <LogOutIcon size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="nav-guest-cluster">
              <Link to="/login" className="btn-secondary-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary-sm">
                Create account
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className={`bar ${mobileMenuOpen ? "rot-top" : ""}`} />
            <span className={`bar ${mobileMenuOpen ? "hide" : ""}`} />
            <span className={`bar ${mobileMenuOpen ? "rot-bot" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
