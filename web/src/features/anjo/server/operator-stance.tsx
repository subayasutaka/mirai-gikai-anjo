import "server-only";
import {
  isOperatorVoteCast,
  type OperatorStanceState,
  operatorVoteText,
} from "@mirai-gikai/shared/anjo/operator-stance";
import { formatProgressDateWithYear } from "@mirai-gikai/shared/anjo/progress-dates";
import { Furigana } from "./furigana";
import { ReadingText } from "./reading-text";

/** 運営者の意見の欄。記録の欄（説明・議員の発言）とは枠の形を変え、賛否で色を変えない。 */
export function AnjoOperatorStance({
  billName,
  view,
  debated,
}: {
  billName: string;
  view: OperatorStanceState;
  debated: boolean;
}) {
  if (view.state === "hidden") return null;
  return (
    <section
      className="anjo-operator-stance"
      aria-labelledby="anjo-operator-stance-title"
    >
      <p className="anjo-operator-stance-eyebrow">
        <Furigana>運営者の意見</Furigana>
      </p>
      <h2 id="anjo-operator-stance-title">
        <ReadingText
          normal="すば康貴の賛成・反対と、その理由"
          hard="すば康貴の賛否と理由"
        />
      </h2>
      <p className="anjo-operator-stance-lead">
        <ReadingText
          normal="この欄は、このサイトを運営する安城市議会議員のすば康貴の考えです。議会や市の考えではありません。ほかの議員の考えは、上の「議員の質問・意見」の欄で読めます。"
          hard="本欄は、運営者である安城市議会議員すば康貴個人の意見です。議会・市の見解ではありません。他の議員の発言は、議案質疑・委員会質疑・討論欄をご覧ください。"
        />
      </p>
      {view.state === "pending" && (
        <p>
          <ReadingText
            normal="議会で決まったあとに載せます。"
            hard="議決後に掲載します。"
          />
        </p>
      )}
      {view.state === "missing" && (
        <p>
          <ReadingText
            normal="賛成・反対は、まだ載せていません。"
            hard="賛否は未掲載です。"
          />
        </p>
      )}
      {view.state === "shown" && (
        <>
          <p className="anjo-operator-stance-vote">
            <ReadingText {...operatorVoteText(view.stance.vote, billName)} />
          </p>
          {view.stance.reasons.length > 0 ? (
            <ul>
              {view.stance.reasons.map((reason, index) => (
                <li key={`${index}-${reason}`}>
                  <Furigana>{reason}</Furigana>
                </li>
              ))}
            </ul>
          ) : (
            isOperatorVoteCast(view.stance.vote) && (
              <p>
                <ReadingText
                  normal="理由はまだ書いていません。"
                  hard="理由は未記載です。"
                />
              </p>
            )
          )}
          {debated && (
            <p>
              <ReadingText
                normal="本会議で、採決の前に意見を述べました。その要約は上の「採決の前に議員が述べた賛成・反対の意見」の欄にあります。"
                hard="本会議で討論を行いました。要旨は「討論」欄に、ほかの討論者と同じ形式で掲載しています。"
              />
            </p>
          )}
          <p className="anjo-small">
            <ReadingText
              normal={`書いた日：${formatProgressDateWithYear(view.stance.writtenOn)}`}
              hard={`記載日：${formatProgressDateWithYear(view.stance.writtenOn)}`}
            />
          </p>
        </>
      )}
    </section>
  );
}
