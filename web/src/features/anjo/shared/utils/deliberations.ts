export const DELIBERATION_HEADINGS = [
  "議案質疑",
  "委員会質疑",
  "一般質問",
] as const;
export function splitDeliberations(markdown: string) {
  const records: Partial<
    Record<(typeof DELIBERATION_HEADINGS)[number], string>
  > = {};
  const body = markdown.replace(
    /^## (議案質疑|委員会質疑|一般質問)\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm,
    (_, heading, content) => {
      const key = heading as (typeof DELIBERATION_HEADINGS)[number];
      records[key] = [records[key], content.trim()]
        .filter(Boolean)
        .join("\n\n");
      return "";
    }
  );
  return { body: body.trim(), records };
}
