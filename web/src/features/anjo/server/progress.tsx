import "server-only";
import {
  ANJO_PROGRESS_STEPS,
  ANJO_STATUS_LABELS,
  getAnjoProgressIndex,
} from "@mirai-gikai/shared/anjo/config";
import { Check, MapPin } from "lucide-react";
import { Furigana } from "./furigana";

export function AnjoProgress({
  status,
  note,
  sessionName,
}: {
  status: string;
  note?: string | null;
  sessionName?: string;
}) {
  const current = getAnjoProgressIndex(status);
  return (
    <section className="anjo-progress" aria-label="議案の進み方">
      <div className="anjo-progress-heading">
        <div>
          <p className="anjo-eyebrow">
            <Furigana>{"議会のいま"}</Furigana>
          </p>
          <h2>
            <Furigana>{sessionName || "この議案の進み方"}</Furigana>
          </h2>
        </div>
        <span className="anjo-current-label">
          <MapPin size={15} aria-hidden="true" />
          <Furigana>
            {current < 0 ? "状況を確認中" : ANJO_STATUS_LABELS[status]}
          </Furigana>
        </span>
      </div>
      <ol className="anjo-progress-steps">
        {ANJO_PROGRESS_STEPS.map((step, index) => (
          <li
            key={step.label}
            data-state={
              index === current ? "current" : index < current ? "done" : "next"
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
            <span className="anjo-step-description">
              <Furigana>{step.description}</Furigana>
            </span>
            {index === current && (
              <span className="anjo-here">
                <Furigana>{"ここまで進んでいます"}</Furigana>
              </span>
            )}
          </li>
        ))}
      </ol>
      {note && (
        <p className="anjo-progress-note">
          <Furigana>{note}</Furigana>
        </p>
      )}
    </section>
  );
}
