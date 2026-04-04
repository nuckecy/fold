import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--fold-space-4)",
      padding: "var(--fold-space-10) var(--fold-space-8)",
      textAlign: "center",
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: "var(--fold-radius-full)",
        background: "var(--fold-bg-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Icon size={24} color="var(--fold-text-tertiary)" />
      </div>
      <div>
        <p style={{
          fontSize: "var(--fold-type-headline)",
          fontWeight: 600,
          color: "var(--fold-text-primary)",
          letterSpacing: "-0.02em",
        }}>
          {title}
        </p>
        <p style={{
          fontSize: "var(--fold-type-subhead)",
          color: "var(--fold-text-secondary)",
          marginTop: "var(--fold-space-1)",
          lineHeight: 1.5,
        }}>
          {description}
        </p>
      </div>
      {action && (
        <Link href={action.href} className="btn-primary" style={{ width: "auto", padding: "0 var(--fold-space-8)" }}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
