import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-16 w-16"
  };

  return (
    <img
      src="/lovable-uploads/362fb681-0ad2-4dc1-b95d-62bb200d1ffe.png"
      alt="SBS - Sport Body System"
      className={cn("object-contain", sizeClasses[size], className)}
    />
  );
}