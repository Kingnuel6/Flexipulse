import { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-dim disabled:opacity-50",
    secondary: "bg-bg-elevated text-text-primary border border-border hover:border-accent",
    ghost: "text-text-secondary hover:text-text-primary",
  };

  return (
    <button
      className={cn(
        "rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
