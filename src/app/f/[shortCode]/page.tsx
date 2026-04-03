"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FormField {
  id: string;
  fieldName: string;
  fieldType: string;
  fieldLabels: Record<string, string>;
  isRequired: boolean;
}

interface FormData {
  eventTitle: string;
  formLanguage: string;
  welcomeMessage: string | null;
  confirmationMessage: string | null;
  dataProtectionText: string | null;
  showDataProtection: boolean;
  supportedLanguages: string[];
  fields: FormField[];
  closed?: boolean;
  message?: string;
}

const identityFields = new Set([
  "first_name",
  "last_name",
  "full_name",
  "email",
  "phone",
]);

export default function PublicFormPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lang, setLang] = useState("en");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    fetch(`/api/f/${shortCode}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData(data);
        setLoading(false);

        // Auto-detect language
        if (data.formLanguage === "auto") {
          const browserLang = navigator.language.slice(0, 2);
          const supported = data.supportedLanguages || ["en"];
          setLang(supported.includes(browserLang) ? browserLang : supported[0]);
        } else if (data.formLanguage) {
          setLang(data.formLanguage);
        }
      })
      .catch(() => setLoading(false));
  }, [shortCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading form...</div>
      </div>
    );
  }

  if (!formData || formData.closed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold">Form Closed</h1>
          <p className="text-sm text-neutral-500 mt-2">
            {formData?.message || "This form is no longer accepting submissions."}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="text-4xl">&#10003;</div>
          <h1 className="text-2xl font-bold">Thank you!</h1>
          <p className="text-sm text-neutral-500">
            {formData.confirmationMessage ||
              "Your submission has been received. We will be in touch soon."}
          </p>
        </div>
      </div>
    );
  }

  const fields = formData.fields;
  const identityFieldList = fields.filter((f) => identityFields.has(f.fieldName));
  const otherFieldList = fields.filter((f) => !identityFields.has(f.fieldName));

  // Progressive disclosure: step 0 = identity, step 1 = other + consent
  // Desktop: show everything on one page
  const useSteps = isMobile && identityFieldList.length > 0 && otherFieldList.length > 0;
  const totalSteps = useSteps ? 2 : 1;

  function getLabel(field: FormField): string {
    const labels = field.fieldLabels as Record<string, string>;
    return labels[lang] || labels.en || field.fieldName;
  }

  function renderField(field: FormField) {
    const label = getLabel(field);
    const value = values[field.id] || "";

    const inputClass =
      "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-100";

    return (
      <div key={field.id}>
        <label className="block text-sm font-medium mb-1">
          {label}
          {field.isRequired && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {field.fieldType === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) =>
              setValues({ ...values, [field.id]: e.target.value })
            }
            rows={3}
            className={inputClass}
            required={field.isRequired}
          />
        ) : field.fieldType === "select" ? (
          <select
            value={value}
            onChange={(e) =>
              setValues({ ...values, [field.id]: e.target.value })
            }
            className={inputClass}
            required={field.isRequired}
          >
            <option value="">Select...</option>
          </select>
        ) : field.fieldType === "checkbox" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) =>
                setValues({
                  ...values,
                  [field.id]: e.target.checked ? "true" : "",
                })
              }
              className="rounded border-neutral-300 dark:border-neutral-700"
            />
            {label}
          </label>
        ) : (
          <input
            type={
              field.fieldType === "email"
                ? "email"
                : field.fieldType === "phone"
                  ? "tel"
                  : field.fieldType === "date"
                    ? "date"
                    : "text"
            }
            value={value}
            onChange={(e) =>
              setValues({ ...values, [field.id]: e.target.value })
            }
            className={inputClass}
            required={field.isRequired}
          />
        )}
      </div>
    );
  }

  function validateStep(): boolean {
    const fieldsToValidate =
      useSteps && step === 0 ? identityFieldList : fields;
    const newErrors: string[] = [];

    for (const field of fieldsToValidate) {
      if (field.isRequired && !values[field.id]) {
        newErrors.push(`${getLabel(field)} is required`);
      }
      if (
        field.fieldType === "email" &&
        values[field.id] &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.id])
      ) {
        newErrors.push("Please enter a valid email address");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateStep()) return;

    if (!consent && formData!.showDataProtection) {
      setErrors(["You must accept the data protection terms"]);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    const res = await fetch(`/api/f/${shortCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        values,
        consent,
        honeypot: "", // Empty = real user
        language: lang,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setErrors(data.errors || [data.error || "Submission failed"]);
    }
  }

  function handleNext() {
    if (validateStep()) {
      setStep(1);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{formData.eventTitle}</h1>
          {formData.welcomeMessage && (
            <p className="text-sm text-neutral-500 mt-2">
              {formData.welcomeMessage}
            </p>
          )}
        </div>

        {/* Language switcher */}
        {(formData.supportedLanguages as string[])?.length > 1 && (
          <div className="flex justify-center gap-2">
            {(formData.supportedLanguages as string[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  lang === l
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Step indicator */}
        {useSteps && (
          <div className="flex justify-center gap-2">
            {[0, 1].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full ${
                  s <= step
                    ? "bg-neutral-900 dark:bg-neutral-100"
                    : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              />
            ))}
          </div>
        )}

        {errors.length > 0 && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        {/* Honeypot — hidden from real users */}
        <div className="hidden" aria-hidden="true">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {useSteps ? (
            step === 0 ? (
              <>
                {identityFieldList.map(renderField)}
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  &larr; Back
                </button>
                {otherFieldList.map(renderField)}
                {formData.showDataProtection && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="rounded border-neutral-300 mt-0.5 dark:border-neutral-700"
                      required
                    />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {formData.dataProtectionText}
                    </span>
                  </label>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </>
            )
          ) : (
            <>
              {fields.map(renderField)}
              {formData.showDataProtection && (
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="rounded border-neutral-300 mt-0.5 dark:border-neutral-700"
                    required
                  />
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {formData.dataProtectionText}
                  </span>
                </label>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </>
          )}
        </form>

        <p className="text-center text-xs text-neutral-400">
          Powered by Fold
        </p>
      </div>
    </div>
  );
}
