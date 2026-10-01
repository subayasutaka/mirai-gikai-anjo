import "server-only";
import { CircleCheck, CircleMinus, CircleX } from "lucide-react";
import { formatDateWithDots } from "@/lib/utils/date";
import { anjoDecision } from "../shared/utils/decision";
import { Furigana } from "./furigana";
import { ReadingText } from "./reading-text";

export function AnjoDecision({
  name,
  status,
  date,
  sourceUrl,
  related = false,
}: {
  name: string;
  status: string;
  date: string | null;
  sourceUrl?: string;
  related?: boolean;
}) {
  const result = anjoDecision(name, status);
  const Icon =
    result.tone === "positive"
      ? CircleCheck
      : result.tone === "negative"
        ? CircleX
        : CircleMinus;
  return (
    <section
      className="anjo-decision"
      data-tone={result.tone}
      aria-label={related ? `${name}の結果` : "議決結果"}
    >
      <p className="anjo-small">
        <ReadingText
          normal={related ? "この内容を含む予算の結果" : "議会で決まったこと"}
          hard={related ? "関連補正予算の議決結果" : "議決結果"}
        />
      </p>
      {related && (
        <p className="anjo-decision-bill">
          <Furigana>{name}</Furigana>
        </p>
      )}
      <p className="anjo-decision-result">
        <Icon size={32} aria-hidden="true" />
        <strong>
          <Furigana>{result.label}</Furigana>
        </strong>
      </p>
      <p>
        <ReadingText
          normal={result.explanation}
          hard={
            result.label === "報告"
              ? "議会への報告案件です。"
              : result.label === "結果未確認"
                ? "議決結果は未確認です。"
                : `議決結果：${result.label}。`
          }
        />
      </p>
      {date && (
        <p className="anjo-decision-date">
          <ReadingText
            normal={result.label === "報告" ? "報告日：" : "決まった日："}
            hard={result.label === "報告" ? "提出日：" : "議決日："}
          />
          <time dateTime={date}>{formatDateWithDots(date)}</time>
        </p>
      )}
      {sourceUrl && (
        <p className="anjo-decision-source">
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            <ReadingText
              normal={
                result.label === "報告"
                  ? "出典：市の報告資料（PDF）"
                  : "出典：議会の公式結果（PDF）"
              }
              hard={
                result.label === "報告"
                  ? "出典：安城市議会の報告資料（PDF）"
                  : "出典：安城市議会の公式議決結果（PDF）"
              }
            />
          </a>
        </p>
      )}
    </section>
  );
}
