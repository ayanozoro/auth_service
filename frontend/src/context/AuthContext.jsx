import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getMyProfile,
  loginUser,
  registerUser,
  verifyOtp as apiVerifyOtp,
  verifyEmailToken as apiVerifyEmailToken,
  logoutUser as apiLogoutUser,
} from "../services/api";

const AuthContext = createContext(null);

const USER_STORAGE_KEY = "auth_user_cache";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Synchronize authenticated user with backend session on load
  const checkAuth = useCallback(async () => {
    try {
      const data = await getMyProfile();
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      } else {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Stage 1: Login request - triggers 6-digit OTP code to user's email
   */
  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    return data;
  };

  /**
   * Stage 2: OTP verification - sets session cookies and completes authentication
   */
  const verifyOtp = async (email, otp) => {
    const data = await apiVerifyOtp({ email, otp });
    if (data?.user) {
      setUser(data.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    }
    return data;
  };

  /**
   * Register new account: triggers email verification link
   */
  const register = async (name, email, password) => {
    const data = await registerUser({ name, email, password });
    return data;
  };

  /**
   * Verify registration email token
   */
  const verifyEmailToken = async (token) => {
    const data = await apiVerifyEmailToken(token);
    return data;
  };

  /**
   * Invalidate cookies and clear active session
   */
  const logout = async () => {
    try {
      await apiLogoutUser();
    } catch (err) {
      console.warn("Logout request completed with notice:", err.message);
    } finally {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    verifyOtp,
    register,
    verifyEmailToken,
    logout,
    checkAuth,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
