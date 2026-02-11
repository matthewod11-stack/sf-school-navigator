interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`px-4 py-4 sm:px-6 ${className}`}>{children}</div>
  );
}

export function CardContent({ children, className = "" }: CardProps) {
  return (
    <div className={`px-4 pb-4 sm:px-6 sm:pb-6 ${className}`}>{children}</div>
  );
}
