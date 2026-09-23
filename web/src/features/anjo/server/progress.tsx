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
import { Check, MapPin } from "lucide-react";
import { Furigana } from "./furigana";
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
  if (kind === "consent") {
    const current = getAnjoProgressIndex(status);
    return (
      <section className="anjo-progress" aria-label="人事の同意案の状況">
        <h2>
          <ReadingText
            normal="委員を選ぶ案はどうなった？"
            hard="人事同意案の審議・議決結果"
          />
        </h2>
        <p>
          <Furigana>{getAnjoDocumentStatus(documentName, status)}</Furigana>
        </p>
        <p>
          <Furigana>
            委員の選任・任命について、議会の同意を求める案件です。
          </Furigana>
        </p>
        {ANJO_PROGRESS_STEPS.map((step, index) => {
          const date = formatProgressDate(dates[step.dateField]);
          if (!date) return null;
          return (
            <p key={step.dateField}>
              <Furigana>{`${index === 0 ? "提出" : step.label}${index > current ? "予定" : ""}：${date}`}</Furigana>
            </p>
          );
        })}
        {note && (
          <p className="anjo-progress-note">
            <Furigana>{note}</Furigana>
          </p>
        )}
      </section>
    );
  }
  if (kind === "report") {
    const dateLabel = formatProgressDate(dates.introduction_date);
    return (
      <section className="anjo-progress" aria-label="報告の位置づけ">
        <h2>
          <ReadingText normal="この報告について" hard="報告案件の位置づけ" />
        </h2>
        <p>
          <Furigana>
            議会への報告資料です。可決・否決を決める採決の対象ではありません。
          </Furigana>
        </p>
        {dateLabel && (
          <p>
            <Furigana>{`提出：${dateLabel}`}</Furigana>
          </p>
        )}
        {note && (
          <p className="anjo-progress-note">
            <Furigana>{note}</Furigana>
          </p>
        )}
      </section>
    );
  }
  const current = getAnjoProgressIndex(status);
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
              normal={sessionName || "この議案の進み方"}
              hard={sessionName || "審議経過・議決結果"}
            />
          </h2>
        </div>
        <span className="anjo-current-label">
          <MapPin size={15} aria-hidden="true" />
          <Furigana>
            {current < 0
              ? "状況を確認中"
              : getAnjoDocumentStatus(documentName, status)}
          </Furigana>
        </span>
      </div>
      <ol className="anjo-progress-steps">
        {steps.map((step, index) => {
          const date = dates[step.dateField];
          const dateLabel = formatProgressDate(date);
          return (
            <li
              key={step.label}
              data-state={
                index === current
                  ? "current"
                  : index < current
                    ? "done"
                    : "next"
              }
              aria-current={index === current ? "step" : undefined}
            >
              <span className="anjo-step-marker">
                {index < current ? (
                  <Check size={17} aria-label="通過した段階" />
                ) : (
                  index + 1
                )}
              </span>
              <strong>
                <Furigana>{step.label}</Furigana>
              </strong>
              <span className="anjo-step-date">
                {dateLabel ? (
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
              {dateLabel && index > current && (
                <span className="anjo-step-planned">
                  <Furigana>{"予定"}</Furigana>
                </span>
              )}
              <span className="anjo-step-description">
                <Furigana>{step.description}</Furigana>
              </span>
              {index === current && (
                <span className="anjo-here">
                  <Furigana>{"ここまで進んでいます"}</Furigana>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {note && (
        <p className="anjo-progress-note">
          <Furigana>{note}</Furigana>
        </p>
      )}
    </section>
  );
}
