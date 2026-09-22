import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name must be 120 characters or fewer");

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

const approxCount = z
  .number()
  .int("Approximate count must be a whole number")
  .min(1, "Approximate count must be at least 1")
  .max(100000, "Approximate count must be 100000 or fewer");

const operator = z
  .string()
  .trim()
  .max(120, "Operator must be 120 characters or fewer")
  .optional();

const notes = z
  .string()
  .trim()
  .max(1000, "Notes must be 1000 characters or fewer")
  .optional();

const status = z.enum(["active", "neutralized"]);

/**
 * A citation makes a submission reviewable instead of a coin flip, so it is
 * the one optional-looking field reviewers are told to weigh. Only http(s)
 * is accepted — `javascript:` and `data:` URLs would otherwise be rendered
 * straight into an anchor's href.
 */
const sourceUrl = z
  .union([
    z.literal(""),
    z
      .url("Source must be a valid URL")
      .max(500, "Source URL must be 500 characters or fewer")
      .refine(
        (value) => /^https?:\/\//i.test(value),
        "Source must start with http:// or https://",
      ),
  ])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const createSiteSchema = z.object({
  name,
  lat,
  lng,
  approxCount,
  operator,
  notes,
  sourceUrl,
});

export const updateSiteSchema = z
  .object({
    name: name.optional(),
    lat: lat.optional(),
    lng: lng.optional(),
    approxCount: approxCount.optional(),
    operator,
    notes,
    sourceUrl,
    status: status.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const siteIdSchema = z.uuid();

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
