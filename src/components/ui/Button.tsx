import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "alert" | "ok" | "pop";

const variantClasses: Record<Variant, string> = {
  default: "bg-panel text-ink",
  alert: "bg-alert text-paper border-alert",
  ok: "bg-ok text-paper border-ok",
  // Reserved for invitations — the one colour on the board that isn't
  // reporting a state. Used sparingly so it keeps meaning "come in".
  pop: "bg-pop text-paper border-pop",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "default",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`hard-border hard-shadow pressable px-4 py-2 text-sm font-bold tracking-wide disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
    />
  );
}
