export interface FieldTemplate {
  fieldName: string;
  fieldType: string;
  fieldLabels: Record<string, string>;
  isRequired: boolean;
  category: string;
}

export const fieldLibrary: FieldTemplate[] = [
  // Identity
  {
    fieldName: "first_name",
    fieldType: "text",
    fieldLabels: { en: "First Name", de: "Vorname" },
    isRequired: true,
    category: "Identity",
  },
  {
    fieldName: "last_name",
    fieldType: "text",
    fieldLabels: { en: "Last Name", de: "Nachname" },
    isRequired: true,
    category: "Identity",
  },
  {
    fieldName: "full_name",
    fieldType: "text",
    fieldLabels: { en: "Full Name", de: "Vollständiger Name" },
    isRequired: true,
    category: "Identity",
  },
  // Contact
  {
    fieldName: "email",
    fieldType: "email",
    fieldLabels: { en: "Email Address", de: "E-Mail-Adresse" },
    isRequired: true,
    category: "Contact",
  },
  {
    fieldName: "phone",
    fieldType: "phone",
    fieldLabels: { en: "Phone Number", de: "Telefonnummer" },
    isRequired: false,
    category: "Contact",
  },
  {
    fieldName: "address",
    fieldType: "textarea",
    fieldLabels: { en: "Address", de: "Adresse" },
    isRequired: false,
    category: "Contact",
  },
  {
    fieldName: "city",
    fieldType: "text",
    fieldLabels: { en: "City", de: "Stadt" },
    isRequired: false,
    category: "Contact",
  },
  {
    fieldName: "postal_code",
    fieldType: "text",
    fieldLabels: { en: "Postal Code", de: "Postleitzahl" },
    isRequired: false,
    category: "Contact",
  },
  // Church-specific
  {
    fieldName: "date_of_birth",
    fieldType: "date",
    fieldLabels: { en: "Date of Birth", de: "Geburtsdatum" },
    isRequired: false,
    category: "Personal",
  },
  {
    fieldName: "gender",
    fieldType: "select",
    fieldLabels: { en: "Gender", de: "Geschlecht" },
    isRequired: false,
    category: "Personal",
  },
  {
    fieldName: "marital_status",
    fieldType: "select",
    fieldLabels: { en: "Marital Status", de: "Familienstand" },
    isRequired: false,
    category: "Personal",
  },
  {
    fieldName: "prayer_requests",
    fieldType: "textarea",
    fieldLabels: { en: "Prayer Requests", de: "Gebetsanliegen" },
    isRequired: false,
    category: "Church",
  },
  {
    fieldName: "how_did_you_hear",
    fieldType: "text",
    fieldLabels: { en: "How did you hear about us?", de: "Wie haben Sie von uns erfahren?" },
    isRequired: false,
    category: "Church",
  },
  {
    fieldName: "previous_church",
    fieldType: "text",
    fieldLabels: { en: "Previous Church", de: "Vorherige Gemeinde" },
    isRequired: false,
    category: "Church",
  },
  {
    fieldName: "decision_made",
    fieldType: "select",
    fieldLabels: { en: "Decision Made", de: "Getroffene Entscheidung" },
    isRequired: false,
    category: "Church",
  },
  {
    fieldName: "follow_up_preference",
    fieldType: "select",
    fieldLabels: { en: "Preferred Follow-up", de: "Bevorzugte Kontaktaufnahme" },
    isRequired: false,
    category: "Church",
  },
];
