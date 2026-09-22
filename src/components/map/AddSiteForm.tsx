"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { VOTING_WINDOW_HOURS } from "@/lib/config/moderation";
import type { Site } from "@/lib/db/schema";
import { createSiteSchema } from "@/lib/validation/site-schemas";

import { SiteFormFields, type SiteFormValues } from "./SiteFormFields";

interface AddSiteFormProps {
  lat: number;
  lng: number;
  onCancel: () => void;
  onCreated: () => void;
}

const EMPTY: SiteFormValues = {
  name: "",
  approxCount: "1",
  operator: "",
  notes: "",
  sourceUrl: "",
};

export function AddSiteForm({
  lat,
  lng,
  onCancel,
  onCreated,
}: AddSiteFormProps) {
  const [values, setValues] = useState<SiteFormValues>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SiteFormValues, string>>
  >({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<Site | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const parsed = createSiteSchema.safeParse({
      name: values.name,
      lat,
      lng,
      approxCount: Number(values.approxCount),
      operator: values.operator || undefined,
      notes: values.notes || undefined,
      sourceUrl: values.sourceUrl || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof SiteFormValues, string>> = {};
      const unattached: string[] = [];
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SiteFormValues;
        // lat/lng come from the map click, not the form, so their errors
        // have nowhere to render — collect them instead of dropping them and
        // leaving the button looking like it did nothing.
        if (key && key in values) fieldErrors[key] = issue.message;
        else unattached.push(issue.message);
      }
      setErrors(fieldErrors);
      setSubmitError(
        unattached.length > 0
          ? `Those coordinates aren't usable: ${unattached.join(", ")}. Close this and click the map again.`
          : null,
      );
      return;
    }

    setErrors({});
    setPending(true);
    setSubmitError(null);
    setDuplicate(null);
    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (response.status === 409) {
        const body = (await response.json().catch(() => null)) as {
          existingSite?: Site;
          error?: string;
        } | null;
        setDuplicate(body?.existingSite ?? null);
        setSubmitError(body?.error ?? "A site is already logged here.");
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setSubmitError(body?.error ?? "Couldn't log this site. Try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Couldn't reach the server. Try again.");
    } finally {
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <Modal title="Submitted for review" onClose={onCreated}>
        <div className="flex flex-col items-start gap-3 text-sm">
          <p className="max-w-prose">
            <strong>{values.name}</strong> is in the review queue. It stays open
            for review for {VOTING_WINDOW_HOURS} hours, and goes on the map if
            enough of the people who look at it agree it&rsquo;s real.
          </p>
          <p className="max-w-prose text-ink-dim">
            Reviewing other submissions is the fastest way to keep the queue
            moving — including yours.
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <a
              href="/queue"
              className="hard-border hard-shadow pressable bg-ok border-ok px-4 py-2 text-sm font-bold text-paper"
            >
              Review the queue
            </a>
            <Button onClick={onCreated}>Back to the map</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Log a site" onClose={onCancel}>
      <p className="mb-3 text-xs text-ink-dim">
        Dropping a pin at{" "}
        <span className="figure">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
        . Submissions go to the review queue before they reach the map.
      </p>

      <SiteFormFields values={values} onChange={setValues} errors={errors} />

      {submitError && (
        <div className="hard-border border-alert mt-3 px-2 py-1.5 text-xs text-alert">
          <p>{submitError}</p>
          {duplicate && (
            <p className="mt-1 text-ink-dim">
              Existing entry: {duplicate.name} (
              <span className="figure">
                {duplicate.lat.toFixed(3)}, {duplicate.lng.toFixed(3)}
              </span>
              )
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button variant="ok" onClick={handleSubmit} disabled={pending}>
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </div>
    </Modal>
  );
}
