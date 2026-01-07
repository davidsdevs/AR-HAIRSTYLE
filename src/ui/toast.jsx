import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

const TOAST_DURATION = 5000; // 5 seconds

export const toastTypes = {
  success: { icon: CheckCircle, color: "bg-green-500", textColor: "text-green-700" },
  error: { icon: AlertCircle, color: "bg-red-500", textColor: "text-red-700" },
  warning: { icon: AlertTriangle, color: "bg-yellow-500", textColor: "text-yellow-700" },
  info: { icon: Info, color: "bg-blue-500", textColor: "text-blue-700" },
  loading: { icon: Loader2, color: "bg-purple-500", textColor: "text-purple-700" },
};

// Toast Context and Provider
const ToastContext = React.createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info", duration = TOAST_DURATION) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);
    
    if (duration > 0 && type !== "loading") {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  // Set toast manager for standalone toast functions
  React.useEffect(() => {
    setToastManager({ addToast, removeToast, removeAllToasts });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// Toast Container
function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-md w-full pointer-events-none"
      style={{ maxHeight: "calc(100vh - 2rem)" }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Individual Toast Component
function Toast({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = toastTypes[toast.type]?.icon || Info;
  const isAnimated = Icon === Loader2;

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto animate-slide-in-right bg-white rounded-lg shadow-xl border border-gray-200 p-4 flex items-start gap-3 min-w-[300px] max-w-md transform transition-all duration-300",
        isExiting && "opacity-0 translate-x-full"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white",
          toastTypes[toast.type]?.color || toastTypes.info.color
        )}
      >
        <Icon
          className={cn("w-5 h-5", isAnimated && "animate-spin")}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 break-words">
          {toast.message}
        </p>
      </div>
      {toast.type !== "loading" && (
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close toast"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// Simple toast manager that doesn't require context (for standalone use)
let toastManager = null;

export const setToastManager = (manager) => {
  toastManager = manager;
};

// Helper functions for easy toast creation
export const toast = {
  success: (message, duration) => {
    if (!toastManager) {
      console.warn("ToastProvider not initialized. Wrap your app with <ToastProvider>");
      return null;
    }
    return toastManager.addToast(message, "success", duration);
  },
  error: (message, duration) => {
    if (!toastManager) {
      console.warn("ToastProvider not initialized. Wrap your app with <ToastProvider>");
      return null;
    }
    return toastManager.addToast(message, "error", duration);
  },
  warning: (message, duration) => {
    if (!toastManager) {
      console.warn("ToastProvider not initialized. Wrap your app with <ToastProvider>");
      return null;
    }
    return toastManager.addToast(message, "warning", duration);
  },
  info: (message, duration) => {
    if (!toastManager) {
      console.warn("ToastProvider not initialized. Wrap your app with <ToastProvider>");
      return null;
    }
    return toastManager.addToast(message, "info", duration);
  },
  loading: (message) => {
    if (!toastManager) {
      console.warn("ToastProvider not initialized. Wrap your app with <ToastProvider>");
      return null;
    }
    return toastManager.addToast(message, "loading", 0);
  },
};

