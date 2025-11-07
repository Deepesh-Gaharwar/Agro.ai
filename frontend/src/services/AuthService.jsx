import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

class AuthService {
  constructor() {
    // Load stored token
    this.token = localStorage.getItem("token") || null;

    // Prevent duplicate interceptors on hot reloads
    if (!AuthService.interceptorsSet) {
      this.setupInterceptors();
      AuthService.interceptorsSet = true;
    }
  }

  // --- Axios Interceptors ---
  setupInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.baseURL = API_BASE_URL;
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn("⚠️ Session expired. Redirecting to login...");
          this.clearAuthData();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // --- Local Storage Helpers ---
  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }

  setUser(user) {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }

  clearAuthData() {
    this.token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // --- Auth API Calls ---

  async login(email, password) {
    try {
      const response = await axios.post(`/login`, { email, password });
      const { access_token, user, message } = response.data;

      if (!access_token || !user) {
        throw new Error("Invalid response from server");
      }

      this.setToken(access_token);
      this.setUser(user);

      return { access_token, user, message: message || "Login successful" };
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      throw new Error(msg);
    }
  }

// AuthService.js

async register(username, email, password) {
  try {
    const response = await axios.post(`/register`, {
      username,
      email,
      password,
    });

    const { access_token, user, message } = response.data;

    if (!access_token || !user) {
      throw new Error("Invalid response from server");
    }

    this.setToken(access_token);
    this.setUser(user);

    return { access_token, user, message: message || "Registration successful" };
  } catch (error) {
    // ✅ Extract readable message
    const msg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Registration failed. Please try again.";

    // ✅ Preserve backend response (so React can access it later)
    const err = new Error(msg);
    err.response = error.response; // 👈 keep response attached
    throw err;
  }
}



  async logout() {
    this.clearAuthData();
    // Optional: Call backend logout endpoint if implemented
    // await axios.post(`/logout`);
  }

  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  getAuthToken() {
    return this.token || localStorage.getItem("token");
  }
}

export const authService = new AuthService();
