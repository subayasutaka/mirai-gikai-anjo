import { TOPIC_CATEGORIES } from "@mirai-gikai/shared/anjo/topics";
export type TopicSearch = Record<string, string | string[] | undefined>;
export function readTopicSearch(input: TopicSearch) {
  return {
    view: input.view === "bills" ? "bills" : "life",
    session: typeof input.session === "string" ? input.session : "",
    category:
      typeof input.category === "string" &&
      (TOPIC_CATEGORIES as readonly string[]).includes(input.category)
        ? input.category
        : "",
    theme: typeof input.theme === "string" ? input.theme.slice(0, 40) : "",
  };
}
export function topicQuery(input: ReturnType<typeof readTopicSearch>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value) query.set(key, value);
  return `?${query.toString()}` as const;
}
