import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/AuthService";

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

  // ✅ Initialize user from localStorage on mount
  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
    }
    setLoading(false);
  }, []);

// src/contexts/AuthContext.jsx
const login = async (email, password) => {
  try {
    const { user } = await authService.login(email, password);
    setUser(user);
    return user;
  } catch (error) {
    console.error("Login error:", error);
    throw error; // ✅ rethrow it so frontend can handle
  }
};

// AuthContext.jsx
const register = async (username, email, password) => {
  try {
    const { user } = await authService.register(username, email, password);
    setUser(user);
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error; // 👈 important
  }
};



  // ✅ Logout and clear all session data
  const logout = () => {
    authService.logout();
    setUser(null);
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
