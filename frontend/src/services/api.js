const RAW_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const API_BASE = RAW_URL.replace(/\/+$/, "") + (RAW_URL.endsWith("/api") ? "" : "/api");

/**
 * Standard HTTP error with status code and parsed backend payload
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Core fetch wrapper with JSON serialization, cookie credentials, and retry on 401/403
 */
export async function apiRequest(endpoint, options = {}, retryOnAuth = true) {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: "include", // Required for HttpOnly cookie authentication
  };

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError(
      "Unable to reach the server. Please check your connection.",
      0,
      { originalError: err.message }
    );
  }

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  // Automatic token refresh handling on 401 or 403 for protected routes
  if ((response.status === 401 || response.status === 403) && retryOnAuth && !endpoint.includes("/login") && !endpoint.includes("/refresh-token")) {
    try {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request without recursive refresh
        return await apiRequest(endpoint, options, false);
      }
    } catch {
      // If refresh fails, fall through to throwing standard error
    }
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data;
}

/**
 * Register a new user: POST /api/register
 * Payload: { name, email, password }
 */
export async function registerUser({ name, email, password }) {
  return await apiRequest("/register", {
    method: "POST",
    body: { name, email, password },
  });
}

/**
 * Sign in (Stage 1): POST /api/login
 * Dispatches 6-digit OTP code to the user's email
 */
export async function loginUser({ email, password }) {
  return await apiRequest("/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * Verify Email Token from verification link: POST /api/verify/:token
 */
export async function verifyEmailToken(token) {
  return await apiRequest(`/verify/${encodeURIComponent(token)}`, {
    method: "POST",
  });
}

/**
 * Verify OTP (Stage 2): POST /api/verify-otp
 * Validates 6-digit code, sets cookies, and logs the user in
 */
export async function verifyOtp({ email, otp }) {
  return await apiRequest("/verify-otp", {
    method: "POST",
    body: { email, otp: otp.toString().trim() },
  });
}

/**
 * Get current authenticated user profile: GET /api/myprofile
 */
export async function getMyProfile() {
  return await apiRequest("/myprofile", {
    method: "GET",
  });
}

/**
 * Refresh access token using HttpOnly refresh cookie: GET /api/refresh-token
 */
export async function refreshToken() {
  try {
    const res = await fetch(`${API_BASE}/refresh-token`, {
      method: "GET",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Logout user and invalidate sessions: GET /api/logout
 */
export async function logoutUser() {
  return await apiRequest("/logout", {
    method: "GET",
  }, false);
}
