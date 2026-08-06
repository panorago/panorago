import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--glass)] " +
  "px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] " +
  "backdrop-blur-xl shadow-[var(--shadow)] transition-[border-color,box-shadow] duration-300 " +
  "focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:shadow-[var(--shadow-gold)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(fieldBase, "h-12", className)}
        {...props}
      />
    );
  },
);

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(fieldBase, "min-h-[7.5rem] resize-y leading-relaxed", className)}
        {...props}
      />
    );
  },
);

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ className, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn(
          "mb-2 block text-sm font-medium tracking-wide text-[var(--foreground)]",
          className,
        )}
        {...props}
      />
    );
  },
);
