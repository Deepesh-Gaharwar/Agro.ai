import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext"; // ✅ import your AuthProvider

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>  {/* ✅ Wrap App inside AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);
