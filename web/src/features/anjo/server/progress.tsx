import "server-only";
import {
  ANJO_PROGRESS_STEPS,
  getAnjoProgressIndex,
} from "@mirai-gikai/shared/anjo/config";
import {
  getAnjoDocumentKind,
  getAnjoDocumentStatus,
} from "@mirai-gikai/shared/anjo/document-kind";
import {
  type AnjoProgressDates,
  formatProgressDate,
} from "@mirai-gikai/shared/anjo/progress-dates";
import { Check, MapPin, Minus } from "lucide-react";
import { isCommitteeOmitted } from "../shared/utils/progress";
import { AnjoMarkdown, Furigana } from "./furigana";
import { ReadingText } from "./reading-text";

export function AnjoProgress({
  status,
  note,
  sessionName,
  dates,
  documentName = "",
}: {
  status: string;
  note?: string | null;
  sessionName?: string;
  dates: AnjoProgressDates;
  documentName?: string;
}) {
  const kind = getAnjoDocumentKind(documentName);
  if (kind === "report") {
    const dateLabel = formatProgressDate(dates.introduction_date);
    return (
      <section className="anjo-progress" aria-label="報告の位置づけ">
        <h2>
          <ReadingText normal="この報告について" hard="報告案件の位置づけ" />
        </h2>
        <p>
          <ReadingText
            normal="市が議会へ報告する資料です。賛成・反対を決める採決は行いません。"
            hard="議会への報告資料です。可決・否決を決める採決の対象ではありません。"
          />
        </p>
        {dateLabel && (
          <p>
            <Furigana>{`提出：${dateLabel}`}</Furigana>
          </p>
        )}
        <ProgressNote note={note} />
      </section>
    );
  }
  const current = getAnjoProgressIndex(status);
  const committeeOmitted = kind === "consent" && isCommitteeOmitted(note);
  const steps = ANJO_PROGRESS_STEPS.map((step, index) =>
    kind === "certification" && index === 2
      ? {
          ...step,
          label: "決算審査",
          description: "分科会・決算特別委員会で調べる",
        }
      : step
  );
  return (
    <section className="anjo-progress" aria-label="議案の進み方">
      <div className="anjo-progress-heading">
        <div>
          <p className="anjo-eyebrow">
            <Furigana>{"議会のいま"}</Furigana>
          </p>
          <h2>
            <ReadingText
              normal={
                kind === "consent"
                  ? "委員を選ぶ案の進み方"
                  : sessionName || "この議案の進み方"
              }
              hard={
                kind === "consent"
                  ? "人事同意案の審議経過"
                  : sessionName || "審議経過・議決結果"
              }
            />
          </h2>
        </div>
        <span className="anjo-current-label">
          <MapPin size={15} aria-hidden="true" />
          <Furigana>
            {current < 0 && kind !== "consent"
              ? "状況を確認中"
              : getAnjoDocumentStatus(documentName, status)}
          </Furigana>
        </span>
      </div>
      <ol className="anjo-progress-steps">
        {steps.map((step, index) => {
          const skipped = committeeOmitted && index === 2;
          const date = dates[step.dateField];
          const dateLabel = formatProgressDate(date);
          return (
            <li
              key={step.label}
              data-state={
                skipped
                  ? "skipped"
                  : index === current
                    ? "current"
                    : index < current
                      ? "done"
                      : "next"
              }
              aria-current={!skipped && index === current ? "step" : undefined}
            >
              <span className="anjo-step-marker">
                {skipped ? (
                  <Minus size={17} aria-label="省略された段階" />
                ) : index < current ||
                  (index === current &&
                    (status === "enacted" || status === "rejected")) ? (
                  <Check size={17} aria-label="完了した段階" />
                ) : (
                  index + 1
                )}
              </span>
              <strong>
                <ReadingText
                  normal={
                    index === 0
                      ? "議案を提出"
                      : index === 1
                        ? "本会議で質問"
                        : index === 2
                          ? kind === "certification"
                            ? "決算を調べる"
                            : "委員会で質問"
                          : "議会で決定"
                  }
                  hard={step.label}
                />
              </strong>
              <span className="anjo-step-date">
                {skipped ? (
                  <Furigana>{"省略"}</Furigana>
                ) : dateLabel ? (
                  <time dateTime={date ?? undefined}>
                    <Furigana>{dateLabel}</Furigana>
                  </time>
                ) : (
                  <Furigana>
                    {kind === "certification" && index === 2
                      ? "日程は本文に記載"
                      : "日付未確認"}
                  </Furigana>
                )}
              </span>
              {!skipped && dateLabel && index > current && (
                <span className="anjo-step-planned">
                  <Furigana>{"予定"}</Furigana>
                </span>
              )}
              <span className="anjo-step-description">
                <ReadingText
                  normal={
                    skipped
                      ? "委員会での審査を省略"
                      : index === 0
                        ? "議会に案を出す"
                        : index === 1
                          ? "議員が内容を確かめる"
                          : index === 2
                            ? "担当の委員会で詳しく調べる"
                            : "賛成・反対を決める"
                  }
                  hard={skipped ? "本会議で委員会付託を省略" : step.description}
                />
              </span>
              {!skipped && index === current && (
                <span className="anjo-here">
                  <Furigana>{"ここまで進んでいます"}</Furigana>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <ProgressNote note={note} />
    </section>
  );
}

function ProgressNote({ note }: { note?: string | null }) {
  if (!note) return null;
  return (
    <details className="anjo-disclosure anjo-progress-note">
      <summary>
        <ReadingText
          normal="確認した資料・日程のメモ"
          hard="資料照合・審議日程の記録"
        />
      </summary>
      <div className="anjo-markdown">
        <AnjoMarkdown>{note}</AnjoMarkdown>
      </div>
    </details>
  );
}
