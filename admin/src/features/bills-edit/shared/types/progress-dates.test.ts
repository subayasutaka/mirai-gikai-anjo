import { ANJO_PROGRESS_STEPS } from "@mirai-gikai/shared/anjo/config";
import { describe, expect, it } from "vitest";
import { billCreateSchema, billUpdateSchema } from "./index";

describe.each([
  billCreateSchema,
  billUpdateSchema,
])("bill milestone date validation", (schema) => {
  it.each(ANJO_PROGRESS_STEPS)("validates and permits clearing $label date", ({
    dateField,
  }) => {
    const partial = schema.partial();
    expect(partial.parse({ [dateField]: "2026-09-03" })[dateField]).toBe(
      "2026-09-03"
    );
    expect(partial.parse({ [dateField]: null })[dateField]).toBeNull();
    expect(partial.parse({})).not.toHaveProperty(dateField);
    expect(partial.safeParse({ [dateField]: "2026-02-29" }).success).toBe(
      false
    );
    expect(partial.safeParse({ [dateField]: "2026-9-3" }).success).toBe(false);
  });
});
