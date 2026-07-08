import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  showArrow?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    "btn-fill relative overflow-hidden border border-foreground bg-foreground text-background",
    "before:absolute before:inset-0 before:z-0 before:bg-accent",
    "before:translate-y-full before:transition-transform before:duration-[420ms] before:ease-[cubic-bezier(0.22,1,0.36,1)]",
    "hover:before:translate-y-0 hover:text-accent-foreground",
    "focus-visible:outline-accent",
  ),
  secondary:
    "bg-muted text-foreground hover:bg-muted/80 border border-transparent",
  ghost: "bg-transparent text-foreground hover:bg-muted border border-transparent",
  outline:
    "bg-transparent text-foreground border border-foreground/20 hover:border-accent/50 hover:bg-accent-muted",
  inverse: cn(
    "btn-fill relative overflow-hidden border border-background bg-background text-foreground",
    "before:absolute before:inset-0 before:z-0 before:bg-accent",
    "before:translate-y-full before:transition-transform before:duration-[420ms] before:ease-[cubic-bezier(0.22,1,0.36,1)]",
    "hover:before:translate-y-0 hover:text-accent-foreground",
  ),
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-base",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-base",
};

function ButtonContent({
  children,
  showArrow,
  variant,
}: {
  children: ReactNode;
  showArrow?: boolean;
  variant: ButtonVariant;
}) {
  const hasFill = variant === "primary" || variant === "inverse";

  return (
    <span
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-2",
        hasFill && "transition-transform duration-300 group-hover/btn:translate-x-0",
      )}
    >
      {children}
      {showArrow && (
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
      )}
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      children,
      showArrow,
      ...props
    },
    ref,
  ) => {
    const autoArrow =
      showArrow ?? (variant === "primary" && typeof children === "string");
    // Fill variants turn accent-green on hover → keep the custom cursor black.
    const cursorHint =
      variant === "primary" || variant === "inverse" ? "dark" : undefined;

    return (
      <button
        ref={ref}
        data-cursor={cursorHint}
        className={cn(
          "group/btn inline-flex cursor-pointer items-center justify-center rounded-full font-medium",
          "transition-[color,background-color,border-color,transform] duration-300 ease-out",
          "hover:scale-[1.02] active:scale-[0.99] motion-reduce:transform-none motion-reduce:hover:scale-100",
          "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        <ButtonContent showArrow={autoArrow} variant={variant}>
          {children}
        </ButtonContent>
      </button>
    );
  },
);

Button.displayName = "Button";
