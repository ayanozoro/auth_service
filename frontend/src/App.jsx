import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import VerifyOpt from "./components/VerifyOpt";
import Verify from "./components/Verify";
import Dashboard from "./components/Dashboard";
import { AlertCircleIcon, ArrowRightIcon } from "./components/Icons";

function NotFound() {
  return (
    <div className="auth-loading-screen">
      <div className="loading-card" style={{ maxWidth: 440 }}>
        <div
          className="loading-icon-wrapper"
          style={{ background: "rgba(244, 63, 94, 0.15)", color: "var(--accent-rose)" }}
        >
          <AlertCircleIcon size={32} />
        </div>
        <h2>404 - Page Not Found</h2>
        <p style={{ color: "var(--text-secondary)", margin: "12px 0 24px" }}>
          The requested page does not exist or has been relocated within the security zone.
        </p>
        <Link to="/" className="btn-primary" style={{ width: "100%" }}>
          Return to Home
          <ArrowRightIcon size={16} />
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <div className="app-body">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOpt />} />
              <Route path="/verify/:token" element={<Verify />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard defaultTab="overview" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Dashboard defaultTab="profile" />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </ToastProvider>
  );
}