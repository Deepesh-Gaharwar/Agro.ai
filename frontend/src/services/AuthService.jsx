import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

class AuthService {
  constructor() {
    this.token = localStorage.getItem("token") || null;

    // Axios request interceptor
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling token expiration
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  setUser(user) {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  async login(email, password) {
    const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
    const { access_token, user } = response.data;

    this.setToken(access_token);
    this.setUser(user);

    return { access_token, user };
  }

  async register(username, email, password) {
    const response = await axios.post(`${API_BASE_URL}/register`, {
      username,
      email,
      password,
    });
    const { access_token, user } = response.data;

    this.setToken(access_token);
    this.setUser(user);

    return { access_token, user };
  }

  async logout() {
    this.clearToken();
  }

  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
}

export const authService = new AuthService();
