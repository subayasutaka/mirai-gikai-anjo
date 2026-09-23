import "server-only";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { Furigana } from "./furigana";
import type { AnjoTopic } from "./topic-repository";

export function TopicCard({
  topic,
  query = "",
}: {
  topic: AnjoTopic;
  query?: string;
}) {
  const c = topic.content;
  return (
    <Link
      href={`${routes.topicDetail(topic.id)}${query}`}
      className="anjo-topic-card"
    >
      <p className="anjo-eyebrow">
        <Furigana>{c.categories.join("・")}</Furigana>
      </p>
      <h3>
        <Furigana>{c.title}</Furigana>
      </h3>
      <p data-reading-level="normal">
        <Furigana>{c.summary}</Furigana>
      </p>
      <p data-reading-level="hard">
        <Furigana>{c.description}</Furigana>
      </p>
      <p className="anjo-small">
        <Furigana>{c.period}</Furigana>
      </p>
      <div className="anjo-topic-money">
        <span>
          <Furigana>{c.moneyLabel}</Furigana>
        </span>
        <strong>
          <Furigana>{c.moneyValue}</Furigana>
        </strong>
      </div>
      <span className="anjo-topic-read">
        <Furigana>対象と内容を読む</Furigana>
        <ArrowUpRight size={18} aria-hidden="true" />
      </span>
    </Link>
  );
}
