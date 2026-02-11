type BadgeColor = "blue" | "green" | "yellow" | "red" | "gray";

const colorStyles: Record<BadgeColor, string> = {
  blue: "bg-brand-100 text-brand-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorStyles[color]} ${className}`}
    >
      {children}
    </span>
  );
}
