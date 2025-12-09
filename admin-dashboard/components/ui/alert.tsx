"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useState } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

// ============================================
// ALERT COMPONENT
// ============================================

type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const alertVariants = {
  success: {
    container: "bg-success-50 text-success-800 border-success-200",
    icon: <CheckCircle className="w-5 h-5 text-success-500" />,
  },
  warning: {
    container: "bg-warning-50 text-warning-800 border-warning-200",
    icon: <AlertTriangle className="w-5 h-5 text-warning-500" />,
  },
  error: {
    container: "bg-error-50 text-error-800 border-error-200",
    icon: <AlertCircle className="w-5 h-5 text-error-500" />,
  },
  info: {
    container: "bg-info-50 text-info-800 border-info-200",
    icon: <Info className="w-5 h-5 text-info-500" />,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border flex gap-3",
        alertVariants[variant].container,
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{alertVariants[variant].icon}</div>
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// TOAST COMPONENT
// ============================================

interface ToastProps {
  id: string;
  variant?: AlertVariant;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({
  id,
  variant = "info",
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        "p-4 rounded-lg border shadow-lg flex gap-3 animate-slide-up min-w-[300px] max-w-md",
        alertVariants[variant].container,
        "bg-white"
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{alertVariants[variant].icon}</div>
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-neutral-900 mb-0.5">{title}</p>}
        <p className="text-sm text-neutral-600">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================
// TOAST CONTAINER COMPONENT
// ============================================

interface ToastData {
  id: string;
  variant?: AlertVariant;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const positionClasses = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

export function ToastContainer({
  toasts,
  onClose,
  position = "top-right",
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={cn("fixed z-50 flex flex-col gap-2", positionClasses[position])}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

// ============================================
// USE TOAST HOOK
// ============================================

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, "id">) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, title?: string) =>
    addToast({ variant: "success", message, title });

  const error = (message: string, title?: string) =>
    addToast({ variant: "error", message, title });

  const warning = (message: string, title?: string) =>
    addToast({ variant: "warning", message, title });

  const info = (message: string, title?: string) =>
    addToast({ variant: "info", message, title });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
