import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  companyName?: string;
}

export function Logo({ className, companyName = "IT-Optimization" }: LogoProps) {
  return (
    <img
      src="/LOGO.svg"
      alt={companyName}
      width={240}
      height={27}
      className={cn("h-7 w-auto md:h-8", className)}
    />
  );
}
