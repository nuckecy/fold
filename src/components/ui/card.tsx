import Link from "next/link";

interface CardProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, href, className = "", style }: CardProps) {
  if (href) {
    return (
      <Link href={href} className={`card ${className}`} style={{ ...style, textDecoration: "none" }}>
        {children}
      </Link>
    );
  }
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

interface MetricCardProps {
  value: string | number;
  label: string;
  valueColor?: string;
  href?: string;
}

export function MetricCard({ value, label, valueColor, href }: MetricCardProps) {
  const content = (
    <>
      <span className="value" style={valueColor ? { color: valueColor } : undefined}>{value}</span>
      <span className="label">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="metric-card" style={{ flex: 1, textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }

  return (
    <div className="metric-card" style={{ flex: 1 }}>
      {content}
    </div>
  );
}
