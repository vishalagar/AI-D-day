"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { Site } from "@/lib/db/schema";
import { updateSiteSchema } from "@/lib/validation/site-schemas";

import { SiteFormFields, type SiteFormValues } from "./SiteFormFields";

interface EditSiteFormProps {
  site: Site;
  onCancel: () => void;
  onSaved: (updatedSite: Site, returnedToReview: boolean) => void;
}

export function EditSiteForm({ site, onCancel, onSaved }: EditSiteFormProps) {
  const [values, setValues] = useState<SiteFormValues>({
    name: site.name,
    approxCount: String(site.approxCount),
    operator: site.operator ?? "",
    notes: site.notes ?? "",
    sourceUrl: site.sourceUrl ?? "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SiteFormValues, string>>
  >({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const parsed = updateSiteSchema.safeParse({
      name: values.name,
      approxCount: Number(values.approxCount),
      operator: values.operator || undefined,
      notes: values.notes || undefined,
      sourceUrl: values.sourceUrl || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof SiteFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SiteFormValues;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setPending(true);
    setSubmitError(null);
    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await response.json().catch(() => null)) as {
        site?: Site;
        returnedToReview?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !body?.site) {
        setSubmitError(body?.error ?? "Couldn't save changes. Try again.");
        return;
      }
      onSaved(body.site, body.returnedToReview ?? false);
    } catch {
      setSubmitError("Couldn't reach the server. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <p className="mb-3 text-xs text-ink-dim">
        Changing the details sends this entry back to the review queue, so the
        community can confirm the new version.
      </p>
      <SiteFormFields values={values} onChange={setValues} errors={errors} />
      {submitError && <p className="mt-3 text-xs text-alert">{submitError}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button variant="ok" onClick={handleSubmit} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
