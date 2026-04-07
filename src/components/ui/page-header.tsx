import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  back?: string;
  badge?: number;
  action?: React.ReactNode;
}

export function PageHeader({ title, back, badge, action }: PageHeaderProps) {
  return (
    <div className="page-header" style={{ padding: "var(--fold-space-4) var(--fold-space-5) var(--fold-space-3)" }}>
      {back && (
        <Link href={back} className="back">
          <ArrowLeft size={20} />
        </Link>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-2)" }}>
        {badge !== undefined && badge > 0 && (
          <span className="badge">{badge}</span>
        )}
        <span className="title">{title}</span>
      </div>
      {action}
    </div>
  );
}
