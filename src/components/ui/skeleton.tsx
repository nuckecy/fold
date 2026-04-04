interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 20,
  radius = "var(--fold-radius-sm)",
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--fold-space-3)" }}>
      <Skeleton height={20} width="70%" />
      <div style={{ display: "flex", gap: "var(--fold-space-2)" }}>
        <Skeleton height={24} width={60} radius="var(--fold-radius-full)" />
        <Skeleton height={24} width={60} radius="var(--fold-radius-full)" />
      </div>
      <Skeleton height={14} width="40%" />
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="metric-card" style={{ flex: 1 }}>
      <Skeleton height={28} width={40} />
      <Skeleton height={12} width={50} />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--fold-space-4)", padding: "var(--fold-space-3) var(--fold-space-4)", minHeight: 52 }}>
      <Skeleton width={20} height={20} radius="var(--fold-radius-full)" />
      <Skeleton height={17} width="60%" />
    </div>
  );
}
