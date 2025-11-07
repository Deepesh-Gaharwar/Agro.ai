import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/AuthService";
import { useToast } from "../contexts/useToast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // ✅ Initialize user from localStorage on mount
  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser) setUser(existingUser);
    setLoading(false);
  }, []);

  // ✅ Login with error handling
  const login = async (email, password) => {
    try {
      const { user } = await authService.login(email, password);
      setUser(user);
      addToast("Login successful!", "success");
      return user;
    } catch (error) {
      console.error("Login error:", error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Login failed. Please try again.";
      addToast(msg, "error");
      throw error;
    }
  };

  // ✅ Register with error handling
  const register = async (username, email, password) => {
    try {
      const { user } = await authService.register(username, email, password);
      setUser(user);
      addToast("Registration successful!", "success");
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      addToast(msg, "error");
      throw error;
    }
  };

  // ✅ Logout and redirect to landing page
const logout = () => {
  authService.logout();
  setUser(null);
  addToast("Logged out successfully!", "info");
  setTimeout(() => navigate("/home", { replace: true }), 100);
};


  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
