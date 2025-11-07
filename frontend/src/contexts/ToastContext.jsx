import React, { useState } from "react";
import { ToastContext } from "./useToast.js";

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // ✅ Add toast helper (supports message + type)
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* ✅ Toast Display UI */}
      <div className="fixed bottom-5 right-5 space-y-3 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg text-white shadow-lg transition-all duration-300 ${
              toast.type === "error"
                ? "bg-red-600"
                : toast.type === "success"
                ? "bg-green-600"
                : "bg-blue-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
