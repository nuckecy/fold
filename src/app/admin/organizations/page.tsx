"use client";

export default function AdminOrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage all organizations on the platform.</p>
      </div>

      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <h3 className="text-lg font-medium">Multi-org management</h3>
        <p className="text-sm text-neutral-500 mt-1">
          Organization management is ready in the database schema (fld_org_ tables).
          Cross-org visibility is parked for v2 per ADR-004.
        </p>
        <p className="text-xs text-neutral-400 mt-3">
          Current setup: standalone orgs, same name + different country allowed.
        </p>
      </div>
    </div>
  );
}
