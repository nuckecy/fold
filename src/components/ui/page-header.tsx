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
    <div className="page-header">
      {back && (
        <Link href={back} className="back">
          <ArrowLeft size={20} />
        </Link>
      )}
      <span className="title" style={{ flex: 1 }}>{title}</span>
      {badge !== undefined && badge > 0 && (
        <span className="badge">{badge}</span>
      )}
      {action}
    </div>
  );
}
