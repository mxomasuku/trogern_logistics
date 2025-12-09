"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

// ============================================
// INPUT COMPONENT
// ============================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, icon, className, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "block w-full px-3 py-2 text-sm rounded-lg border border-neutral-300",
            "bg-white text-neutral-700 placeholder-neutral-400",
            "focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-electric-500",
            "transition-colors duration-150",
            error && "border-error-500 focus:ring-error-500 focus:border-error-500",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

// ============================================
// SELECT COMPONENT
// ============================================

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "block w-full px-3 py-2 text-sm rounded-lg border border-neutral-300",
          "bg-white text-neutral-700 placeholder-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-electric-500",
          "transition-colors duration-150",
          "appearance-none bg-no-repeat bg-right pr-10",
          error && "border-error-500 focus:ring-error-500 focus:border-error-500",
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1.5em 1.5em",
        }}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

// ============================================
// TEXTAREA COMPONENT
// ============================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "block w-full px-3 py-2 text-sm rounded-lg border border-neutral-300",
          "bg-white text-neutral-700 placeholder-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-electric-500",
          "transition-colors duration-150 resize-none",
          error && "border-error-500 focus:ring-error-500 focus:border-error-500",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

// ============================================
// LABEL COMPONENT
// ============================================

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label
      className={cn("block text-sm font-medium text-neutral-700 mb-1.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-error-500 ml-1">*</span>}
    </label>
  );
}

// ============================================
// FORM GROUP COMPONENT
// ============================================

interface FormGroupProps {
  children: React.ReactNode;
  error?: string;
  className?: string;
}

export function FormGroup({ children, error, className }: FormGroupProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
      {error && <p className="text-sm text-error-500 mt-1">{error}</p>}
    </div>
  );
}

// ============================================
// SEARCH INPUT COMPONENT
// ============================================

import { Search } from "lucide-react";

interface SearchInputProps extends Omit<InputProps, "icon"> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ onSearch, className, ...props }: SearchInputProps) {
  return (
    <Input
      type="search"
      placeholder="Search..."
      icon={<Search className="w-4 h-4" />}
      onChange={(e) => onSearch?.(e.target.value)}
      className={cn("w-64", className)}
      {...props}
    />
  );
}
