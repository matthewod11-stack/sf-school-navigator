type BadgeColor = "blue" | "green" | "yellow" | "red" | "gray";

const colorStyles: Record<BadgeColor, string> = {
  blue: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-800",
  yellow: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-800",
  gray: "bg-neutral-100 text-neutral-700",
};

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

export function Badge({ children, color = "blue", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${colorStyles[color]} ${className}`}
    >
      {children}
    </span>
  );
}
