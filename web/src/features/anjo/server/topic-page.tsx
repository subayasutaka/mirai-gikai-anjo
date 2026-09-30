import "server-only";
import {
  getAnjoDocumentKind,
  getAnjoDocumentStatus,
  isAnjoSubmissionPlanned,
} from "@mirai-gikai/shared/anjo/document-kind";
import { formatProgressDate } from "@mirai-gikai/shared/anjo/progress-dates";
import { topicReading } from "@mirai-gikai/shared/anjo/topics";
import Link from "next/link";
import { notFound } from "next/navigation";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import { AnjoChat } from "../client/chat";
import {
  readTopicSearch,
  type TopicSearch,
  topicQuery,
} from "../shared/topic-navigation";
import { decisionDate, decisionSource } from "../shared/utils/decision";
import { BackToList } from "./back-to-list";
import { AnjoDecision } from "./decision";
import { Furigana } from "./furigana";
import { ReadingMarkdown, ReadingText } from "./reading-text";
import { ThemePhoto } from "./theme-photo";
import { TopicCard } from "./topic-card";
import { listAnjoTopics } from "./topic-repository";

export async function AnjoTopicPage({
  id,
  search,
}: {
  id: string;
  search: TopicSearch;
}) {
  const all = await listAnjoTopics();
  const topic = all.find((t) => t.id === id);
  if (!topic) notFound();
  const c = topic.content;
  const query = topicQuery(
    readTopicSearch({ ...search, session: topic.diet_session_id })
  );
  const bills = topic.anjo_topic_bills.flatMap((link) =>
    link.bills ? [link.bills] : []
  );
  const primary = bills[0];
  return (
    <article className="anjo-content-page anjo-detail-page">
      <BackToList query={query} />
      <header className="anjo-detail-heading">
        <p className="anjo-eyebrow">
          <Furigana>{topic.diet_sessions?.name || "会期未登録"}</Furigana> /{" "}
          <Furigana>{c.categories.join("・")}</Furigana>
        </p>
        <h1>
          <ReadingText normal={c.title} hard={c.formalTitle} />
        </h1>
        <p data-reading-level="normal" className="anjo-lead">
          <Furigana>{c.summary}</Furigana>
        </p>
        <p data-reading-level="hard" className="anjo-lead">
          <Furigana>{c.description}</Furigana>
        </p>
        <p className="anjo-small">
          <Furigana>{`内容更新：${formatDateWithDots(topic.updated_at)}`}</Furigana>
        </p>
      </header>
      <div className="anjo-related-decisions">
        {bills.map((bill) => (
          <AnjoDecision
            key={bill.id}
            name={bill.name}
            status={bill.status}
            date={decisionDate(bill.name, bill.status, bill)}
            sourceUrl={decisionSource(c.knowledgeSource)}
            related
          />
        ))}
      </div>
      <ThemePhoto
        subject={c.formalTitle || c.title}
        caseId={topic.id}
        variant="detail"
      />
      <dl className="anjo-facts-grid">
        <div>
          <dt>
            <ReadingText normal="誰・何が対象？" hard="対象者・対象施設" />
          </dt>
          <dd>
            <ReadingText
              normal={topicReading(c, "target", "normal")}
              hard={topicReading(c, "target", "hard")}
            />
          </dd>
        </div>
        <div>
          <dt>
            <ReadingText normal="いつの話？" hard="対象期間・実施時期" />
          </dt>
          <dd>
            <ReadingText
              normal={topicReading(c, "period", "normal")}
              hard={topicReading(c, "period", "hard")}
            />
          </dd>
        </div>
        <div className="anjo-fact-money">
          <dt>
            <ReadingText
              normal={topicReading(c, "moneyLabel", "normal")}
              hard={topicReading(c, "moneyLabel", "hard")}
            />
          </dt>
          <dd>
            <Furigana>{c.moneyValue}</Furigana>
          </dd>
        </div>
      </dl>
      <p className="anjo-note">
        <ReadingText
          normal={topicReading(c, "importantNote", "normal")}
          hard={topicReading(c, "importantNote", "hard")}
        />
      </p>
      <details className="anjo-disclosure">
        <summary>
          <ReadingText
            normal="お金の内訳・出どころを見る"
            hard="予算内訳・財源"
          />
        </summary>
        <div className="anjo-markdown">
          <ReadingMarkdown
            normal={topicReading(c, "moneyDetails", "normal")}
            hard={c.moneyDetails}
          />
        </div>
      </details>
      <details className="anjo-disclosure">
        <summary>
          <ReadingText
            normal="議会での話し合い・質問と回答"
            hard="審議経過・質疑と答弁"
          />
        </summary>
        <ol className="anjo-content-timeline">
          {(
            [
              { label: "上程", field: "introduction_date" },
              { label: "議案質疑", field: "plenary_question_date" },
            ] as const
          ).map((step) => (
            <li key={step.field}>
              <strong>
                <ReadingText
                  normal={step.label === "上程" ? "議案を提出" : "本会議で質問"}
                  hard={step.label}
                />
              </strong>
              {bills.map((bill) => (
                <p key={bill.id}>
                  <Furigana>{`${bill.name.split(" ")[0]}：${formatProgressDate(bill[step.field]) || "日付未確認"}${isAnjoSubmissionPlanned(bill.name, bill.status) ? "（予定）" : ""}`}</Furigana>
                </p>
              ))}
            </li>
          ))}
          <li>
            <strong>
              <ReadingText normal="委員会で質問" hard="委員会質疑" />
            </strong>
            {c.committeeDates.length ? (
              c.committeeDates.map((d) => (
                <p key={`${d.name}-${d.date}`}>
                  <Furigana>{`${d.name}：${formatProgressDate(d.date) || "日付未確認"}${d.note ? `（${d.note}）` : ""}`}</Furigana>
                </p>
              ))
            ) : (
              <Furigana>日付未確認</Furigana>
            )}
          </li>
          <li>
            <strong>
              <ReadingText normal="議会で決定" hard="採決" />
            </strong>
            {bills.map((b) => (
              <p key={b.id}>
                <Furigana>
                  {getAnjoDocumentKind(b.name) === "report"
                    ? `${b.name.split(" ")[0]}：採決の対象ではありません。`
                    : `${b.name.split(" ")[0]}：${formatProgressDate(b.vote_date) || "日付未確認"}${["enacted", "rejected"].includes(b.status) ? `・${getAnjoDocumentStatus(b.name, b.status)}` : "・予定（結果未確認）"}`}
                </Furigana>
              </p>
            ))}
          </li>
        </ol>
        <h2>
          <ReadingText normal="議員の質問と市の回答" hard="質疑・答弁の概要" />
        </h2>
        <div className="anjo-markdown">
          <ReadingMarkdown
            normal={
              topicReading(c, "deliberationDetails", "normal") ||
              "質問と市の回答は、記録を確認してから掲載します。"
            }
            hard={
              c.deliberationDetails ||
              "質疑・答弁の記録は未登録です。資料確認後、質問者・答弁者・要点・出典を掲載します。"
            }
          />
        </div>
      </details>
      <details className="anjo-disclosure">
        <summary>
          <Furigana>この内容をAIに聞く</Furigana>
        </summary>
        <p>
          <ReadingText
            normal={`質問の対象：${topic.diet_sessions?.name}／${c.title}`}
            hard={`質問の対象：${topic.diet_sessions?.name}／${c.formalTitle}`}
          />
        </p>
        <AnjoChat
          billId={primary.id}
          topicId={topic.id}
          enabled={process.env.ANJO_AI_ENABLED === "true"}
        />
      </details>
      <section className="anjo-content-bills">
        <h2>
          <ReadingText normal="この内容が入っている議案" hard="関連する議案" />
        </h2>
        <p>
          <ReadingText
            normal="予算全体の金額と、ほかの内容も読めます。"
            hard="関連する会計全体の補正額と、ほかの予算項目を確認できます。"
          />
        </p>
        {bills.map((b) => (
          <Link
            key={b.id}
            className="anjo-bill-reference"
            href={`${routes.billDetail(b.id)}${query}`}
          >
            <Furigana>{b.name}</Furigana> →
          </Link>
        ))}
      </section>
      <details className="anjo-disclosure">
        <summary>
          <ReadingText
            normal="もとになった資料・確認できたこと"
            hard="出典・確認範囲"
          />
        </summary>
        <p>
          <ReadingText normal={c.title} hard={c.formalTitle} />
        </p>
        <div className="anjo-markdown">
          <ReadingMarkdown
            normal={topicReading(c, "sourceNote", "normal")}
            hard={c.sourceNote}
          />
        </div>
        {bills
          .filter((b) => b.status_note)
          .map((b) => (
            <details className="anjo-disclosure" key={b.id}>
              <summary>
                <ReadingText
                  normal={`${b.name.split(" ")[0]}：確認した日程のメモ`}
                  hard={`${b.name.split(" ")[0]}：資料照合・審議日程の記録`}
                />
              </summary>
              <div className="anjo-markdown">
                <ReadingMarkdown
                  normal={b.status_note || ""}
                  hard={b.status_note || ""}
                />
              </div>
            </details>
          ))}
        <p className="anjo-small">
          資料確認日：{formatDateWithDots(c.checkedOn)}
        </p>
        <a
          className="anjo-text-link"
          href={c.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Furigana>公式の原資料を開く</Furigana> ↗
        </a>
        <p className="anjo-small">
          <Furigana>
            {topic.is_review_completed
              ? "運営者が確認した説明です。"
              : "説明文は運営者の確認前です。原資料とあわせてご確認ください。"}
          </Furigana>
        </p>
      </details>
      {c.relatedTopics.some((r) => all.some((t) => t.id === r.id)) && (
        <section>
          <h2 className="anjo-browse-title">
            <ReadingText normal="関連する内容" hard="関連事業・類似案件" />
          </h2>
          {c.relatedTopics.map((relation) => {
            const related = all.find((t) => t.id === relation.id);
            if (!related) return null;
            const labels = {
              same_theme: "同じテーマ",
              previous: "前の変更",
              next: "次の変更",
              similar: "参考になる類似の内容",
            };
            return (
              <div key={relation.id} className="anjo-related-topic">
                <p className="anjo-small">
                  <Furigana>{labels[relation.relation]}</Furigana>
                </p>
                <TopicCard topic={related} query={query} />
              </div>
            );
          })}
        </section>
      )}
      <BackToList query={query} bottom />
    </article>
  );
}
