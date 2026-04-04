interface BadgeProps {
  variant?: "brand" | "success" | "error" | "warning" | "info" | "muted";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "brand", children, className = "" }: BadgeProps) {
  return (
    <span className={`status-badge ${variant} ${className}`}>
      {children}
    </span>
  );
}
