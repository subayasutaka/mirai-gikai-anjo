import "server-only";
import {
  getAnjoDocumentKind,
  getAnjoDocumentStatus,
} from "@mirai-gikai/shared/anjo/document-kind";
import { formatProgressDate } from "@mirai-gikai/shared/anjo/progress-dates";
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
import { AnjoMarkdown, Furigana } from "./furigana";
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
    <article className="anjo-content-page">
      <Link
        className="anjo-text-link"
        href={{ pathname: routes.home(), search: query }}
      >
        ← <Furigana>一覧へ戻る</Furigana>
      </Link>
      <header className="anjo-detail-heading">
        <p className="anjo-eyebrow">
          <Furigana>{topic.diet_sessions?.name || "会期未登録"}</Furigana> /{" "}
          <Furigana>{c.categories.join("・")}</Furigana>
        </p>
        <h1>
          <Furigana>{c.title}</Furigana>
        </h1>
        <p data-reading-level="normal" className="anjo-lead">
          <Furigana>{c.summary}</Furigana>
        </p>
        <p data-reading-level="hard" className="anjo-lead">
          <Furigana>{c.description}</Furigana>
        </p>
        <p className="anjo-small">
          <Furigana>{`資料確認：${formatDateWithDots(c.checkedOn)} ／ 内容更新：${formatDateWithDots(topic.updated_at)}`}</Furigana>
        </p>
      </header>
      <dl className="anjo-facts-grid">
        <div>
          <dt>
            <Furigana>誰・何が対象？</Furigana>
          </dt>
          <dd>
            <Furigana>{c.target}</Furigana>
          </dd>
        </div>
        <div>
          <dt>
            <Furigana>いつの話？</Furigana>
          </dt>
          <dd>
            <Furigana>{c.period}</Furigana>
          </dd>
        </div>
        <div className="anjo-fact-money">
          <dt>
            <Furigana>{c.moneyLabel}</Furigana>
          </dt>
          <dd>
            <Furigana>{c.moneyValue}</Furigana>
          </dd>
        </div>
      </dl>
      <p className="anjo-note">
        <Furigana>{c.importantNote}</Furigana>
      </p>
      <p className="anjo-small">
        <Furigana>
          {bills
            .map(
              (b) =>
                `${b.name.split(" ")[0]}：${getAnjoDocumentStatus(b.name, b.status)}`
            )
            .join(" ／ ")}
        </Furigana>
      </p>
      <details className="anjo-disclosure">
        <summary>
          <Furigana>お金の内訳・財源を見る</Furigana>
        </summary>
        <div className="anjo-markdown">
          <AnjoMarkdown>{c.moneyDetails}</AnjoMarkdown>
        </div>
      </details>
      <details className="anjo-disclosure">
        <summary>
          <Furigana>議案の進み方・質問と答弁</Furigana>
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
                <Furigana>{step.label}</Furigana>
              </strong>
              {bills.map((bill) => (
                <p key={bill.id}>
                  <Furigana>{`${bill.name.split(" ")[0]}：${formatProgressDate(bill[step.field]) || "日付未確認"}`}</Furigana>
                </p>
              ))}
            </li>
          ))}
          <li>
            <strong>
              <Furigana>委員会質疑</Furigana>
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
              <Furigana>採決</Furigana>
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
        {bills.map((b) => (
          <p className="anjo-small" key={b.id}>
            <Furigana>
              {b.status_note || "審議状況の詳しい資料は未登録です。"}
            </Furigana>
          </p>
        ))}
        <h2>
          <Furigana>質問と市の答弁</Furigana>
        </h2>
        <div className="anjo-markdown">
          <AnjoMarkdown>
            {c.deliberationDetails ||
              "概要は資料を確認後に掲載します。質問者・質問の要点・市の答弁・出典を、この内容に関係する範囲でまとめます。"}
          </AnjoMarkdown>
        </div>
      </details>
      <details className="anjo-disclosure">
        <summary>
          <Furigana>この内容をAIに聞く</Furigana>
        </summary>
        <p>
          <Furigana>{`質問の対象：${topic.diet_sessions?.name}／${c.title}`}</Furigana>
        </p>
        <AnjoChat
          billId={primary.id}
          topicId={topic.id}
          enabled={process.env.ANJO_AI_ENABLED === "true"}
        />
      </details>
      <section className="anjo-content-bills">
        <h2>
          <Furigana>この内容が入っている議案</Furigana>
        </h2>
        <p>
          <Furigana>会計全体の金額と、ほかの内容を確認できます。</Furigana>
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
          <Furigana>原資料と確認した範囲</Furigana>
        </summary>
        <p>
          <Furigana>{c.formalTitle}</Furigana>
        </p>
        <p>
          <Furigana>{c.sourceNote}</Furigana>
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
            <Furigana>関連する内容</Furigana>
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
    </article>
  );
}
