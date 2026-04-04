import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ListGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ListGroup({ children, className = "" }: ListGroupProps) {
  return (
    <div className={`action-group ${className}`}>
      {children}
    </div>
  );
}

interface ListRowProps {
  icon?: React.ReactNode;
  label: string;
  value?: string | React.ReactNode;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
}

export function ListRow({ icon, label, value, href, onClick, destructive }: ListRowProps) {
  const content = (
    <>
      {icon && <span className="icon">{icon}</span>}
      <span className="text" style={destructive ? { color: "var(--fold-error)" } : undefined}>
        {label}
      </span>
      {value && typeof value === "string" ? (
        <span style={{ fontSize: "var(--fold-type-subhead)", color: "var(--fold-text-secondary)" }}>{value}</span>
      ) : value}
      {href && <ChevronRight size={14} className="chevron" />}
    </>
  );

  if (href) {
    return <Link href={href} className="action-row">{content}</Link>;
  }

  return (
    <button className="action-row" onClick={onClick} style={{ width: "100%", border: "none", textAlign: "left" }}>
      {content}
    </button>
  );
}
