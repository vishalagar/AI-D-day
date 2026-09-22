interface SiteFormValues {
  name: string;
  approxCount: string;
  operator: string;
  notes: string;
  sourceUrl: string;
}

interface SiteFormFieldsProps {
  values: SiteFormValues;
  onChange: (values: SiteFormValues) => void;
  errors?: Partial<Record<keyof SiteFormValues, string>>;
}

const INPUT_CLASS =
  "hard-border bg-paper px-2 py-1.5 w-full text-sm placeholder:text-ink-dim/60";

export function SiteFormFields({
  values,
  onChange,
  errors,
}: SiteFormFieldsProps) {
  const set = (key: keyof SiteFormValues, value: string) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="flex flex-col gap-3">
      <Field label="Site name" error={errors?.name}>
        <input
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={120}
          className={INPUT_CLASS}
          placeholder="Ashburn — Data Center Alley"
        />
      </Field>

      <Field
        label="How many datacenters here?"
        hint="A rough count is fine — nobody publishes exact figures."
        error={errors?.approxCount}
      >
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={100000}
          value={values.approxCount}
          onChange={(e) => set("approxCount", e.target.value)}
          className={`${INPUT_CLASS} figure`}
        />
      </Field>

      <Field label="Operator" hint="Optional" error={errors?.operator}>
        <input
          value={values.operator}
          onChange={(e) => set("operator", e.target.value)}
          maxLength={120}
          className={INPUT_CLASS}
          placeholder="Who runs it, if you know"
        />
      </Field>

      <Field
        label="Source link"
        hint="Optional, but submissions with one get confirmed far faster."
        error={errors?.sourceUrl}
      >
        <input
          type="url"
          value={values.sourceUrl}
          onChange={(e) => set("sourceUrl", e.target.value)}
          maxLength={500}
          className={INPUT_CLASS}
          placeholder="https://"
        />
      </Field>

      <Field label="Notes" hint="Optional" error={errors?.notes}>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          maxLength={1000}
          rows={3}
          className={`${INPUT_CLASS} resize-none`}
          placeholder="Anything a reviewer should know"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{label}</span>
      {hint && <span className="text-xs text-ink-dim -mt-0.5">{hint}</span>}
      {children}
      {error && <span className="text-xs text-alert">{error}</span>}
    </label>
  );
}

export type { SiteFormValues };
