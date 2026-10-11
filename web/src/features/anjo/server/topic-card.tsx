import "server-only";
import { topicReading } from "@mirai-gikai/shared/anjo/topics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { Furigana } from "./furigana";
import { ReadingText } from "./reading-text";
import { ThemePhoto } from "./theme-photo";
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
      <ThemePhoto subject={c.formalTitle || c.title} caseId={topic.id} />
      <p className="anjo-eyebrow">
        <Furigana>{c.categories.join("・")}</Furigana>
      </p>
      <h3>
        <ReadingText normal={c.title} hard={c.formalTitle} />
      </h3>
      <p data-reading-level="normal">
        <Furigana>{c.summary}</Furigana>
      </p>
      <p data-reading-level="hard">
        <Furigana>{c.description}</Furigana>
      </p>
      <p className="anjo-small">
        <ReadingText
          normal={topicReading(c, "period", "normal")}
          hard={topicReading(c, "period", "hard")}
        />
      </p>
      <div className="anjo-topic-money">
        <span>
          <ReadingText
            normal={topicReading(c, "moneyLabel", "normal")}
            hard={topicReading(c, "moneyLabel", "hard")}
          />
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
