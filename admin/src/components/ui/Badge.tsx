interface BadgeProps {
  variant: "success" | "warning" | "danger" | "info" | "neutral";
  children: string;
  onClick?: () => void;
  className?: string;
}

const variantClasses: Record<BadgeProps["variant"], string> = {
  success: "bg-success-500/10 text-success-700",
  warning: "bg-warning-500/10 text-warning-700",
  danger: "bg-danger-500/10 text-danger-700",
  info: "bg-primary-500/10 text-primary-700",
  neutral: "bg-gray-100 text-gray-600",
};

export default function Badge({ variant, children, onClick, className = "" }: BadgeProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        variantClasses[variant]
      } ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
