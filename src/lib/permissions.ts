// Grantable permissions for Sub-Admins (M6)
export const GRANTABLE_PERMISSIONS = [
  { key: "view_records", label: "View records", description: "Access record list and details" },
  { key: "edit_records", label: "Edit records", description: "Modify record field values" },
  { key: "manage_templates", label: "Manage templates", description: "Create and edit email templates" },
  { key: "manage_sequences", label: "Manage sequences", description: "Create and schedule email sequences" },
  { key: "view_reports", label: "View reports", description: "Access dashboard and reports" },
  { key: "manage_forms", label: "Manage forms", description: "Configure digital form settings" },
  { key: "manage_scanners", label: "Manage scanners", description: "Invite and manage scanning team" },
  { key: "pause_sequences", label: "Pause sequences", description: "Pause active email sequences" },
] as const;

// Locked permissions — Admin only, cannot be delegated (M7)
export const LOCKED_PERMISSIONS = [
  "delete_event",
  "manage_team_roles",
  "configure_billing",
] as const;

// Default permissions for new Sub-Admins (M3)
export const DEFAULT_SUB_ADMIN_PERMISSIONS = [
  "view_records",
  "edit_records",
  "view_reports",
] as const;
