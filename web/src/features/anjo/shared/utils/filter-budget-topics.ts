type FilterableTopic = {
  content: { categories: readonly string[]; themes: readonly string[] };
  anjo_topic_bills: readonly { bill_id: string }[];
};

export function filterBudgetTopics<T extends FilterableTopic>(
  topics: readonly T[],
  filter: { category: string; theme: string }
): T[] {
  return topics.filter(
    (topic) =>
      (!filter.category ||
        topic.content.categories.includes(filter.category)) &&
      (!filter.theme || topic.content.themes.includes(filter.theme))
  );
}

export function getTopicBillIds(
  topics: readonly FilterableTopic[]
): Set<string> {
  return new Set(
    topics.flatMap((topic) =>
      topic.anjo_topic_bills.map((link) => link.bill_id)
    )
  );
}
