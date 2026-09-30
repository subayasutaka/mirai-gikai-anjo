import "server-only";
import {
  getAnjoDocumentKind,
  isAnjoSubmissionPlanned,
} from "@mirai-gikai/shared/anjo/document-kind";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { formatDateWithDots } from "@/lib/utils/date";
import { AnjoChat } from "../client/chat";
import { InitialDifficulty } from "../client/reading-preferences";
import {
  readTopicSearch,
  type TopicSearch,
  topicQuery,
} from "../shared/topic-navigation";
import { decisionDate, decisionSource } from "../shared/utils/decision";
import { splitDeliberations } from "../shared/utils/deliberations";
import { BackToList } from "./back-to-list";
import { AnjoDecision } from "./decision";
import { AnjoDeliberations } from "./deliberations";
import { AnjoMarkdown, Furigana } from "./furigana";
import { AnjoProgress } from "./progress";
import { ReadingText } from "./reading-text";
import { getAnjoBill } from "./repository";
import { ThemePhoto } from "./theme-photo";
import { TopicCard } from "./topic-card";
import { listAnjoTopics } from "./topic-repository";

export async function AnjoBillPage({
  id,
  token,
  difficulty,
  search = {},
}: {
  id: string;
  token?: string;
  difficulty?: string;
  search?: TopicSearch;
}) {
  const bill = await getAnjoBill(id, token);
  if (!bill) notFound();
  const submissionPlanned = isAnjoSubmissionPlanned(bill.name, bill.status);
  const submissionDate = submissionPlanned
    ? bill.introduction_date
    : bill.submitted_date;
  const topics = (await listAnjoTopics()).filter((t) =>
    t.anjo_topic_bills.some((link) => link.bill_id === id)
  );
  const query = topicQuery(
    readTopicSearch({ ...search, view: search.view || "bills" })
  );
  return (
    <article className="anjo-detail-page">
      <InitialDifficulty difficulty={difficulty} />
      <BackToList query={query} />
      {token && (
        <p className="anjo-note">
          <Furigana>
            下書きプレビューです。このリンクは確認する方だけに共有してください。
          </Furigana>
        </p>
      )}
      <header className="anjo-detail-heading">
        <p className="anjo-eyebrow">
          <Furigana>{bill.diet_sessions?.name || "安城市議会"}</Furigana>
        </p>
        {(["normal", "hard"] as const).map((level) => (
          <h1 key={level} data-reading-level={level}>
            <Furigana>
              {bill.bill_contents.find((c) => c.difficulty_level === level)
                ?.title || bill.name}
            </Furigana>
          </h1>
        ))}
        <p className="anjo-official-title">
          <Furigana>{bill.name}</Furigana>
        </p>
        <p className="anjo-small">
          <Furigana>{submissionPlanned ? "提出予定日：" : "提出日："}</Furigana>
          {submissionDate ? (
            formatDateWithDots(submissionDate)
          ) : (
            <Furigana>未登録</Furigana>
          )}{" "}
          <Furigana>{"/ 内容更新："}</Furigana>
          {formatDateWithDots(
            new Date(
              Math.max(
                new Date(bill.updated_at).getTime(),
                ...bill.bill_contents.map((content) =>
                  new Date(content.updated_at).getTime()
                )
              )
            ).toISOString()
          )}
        </p>
      </header>
      <AnjoDecision
        name={bill.name}
        status={bill.status}
        date={decisionDate(bill.name, bill.status, bill)}
        sourceUrl={
          decisionSource(bill.knowledge_source || "") ||
          (getAnjoDocumentKind(bill.name) === "report"
            ? bill.shugiin_url || undefined
            : undefined)
        }
      />
      <ThemePhoto subject={bill.name} caseId={bill.id} variant="detail" />
      {topics.length > 0 &&
        (["normal", "hard"] as const).map((level) => (
          <p
            key={level}
            data-reading-level={level}
            className="anjo-panel anjo-lead"
          >
            <Furigana>
              {bill.bill_contents.find((c) => c.difficulty_level === level)
                ?.summary || ""}
            </Furigana>
          </p>
        ))}
      {topics.length > 0 && (
        <section className="anjo-bill-topics">
          <h2 className="anjo-browse-title">
            <ReadingText
              normal="この議案に含まれる内容"
              hard="事業・予算項目の内訳"
            />
          </h2>
          <p className="anjo-small">
            <ReadingText
              normal={`${topics.length}項目を抜粋して説明しています。議案全体の金額は、下の本文で読めます。`}
              hard={`議案内の${topics.length}事業・予算項目を抜粋しています。会計全体の補正額は本文に記載しています。`}
            />
          </p>
          <div className="anjo-topic-grid">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} query={query} />
            ))}
          </div>
        </section>
      )}
      <AnjoProgress
        status={bill.status}
        note={bill.status_note}
        dates={bill}
        documentName={bill.name}
      />
      <div className="anjo-detail-layout">
        <div>
          {!bill.is_review_completed && (
            <p className="anjo-note">
              <Furigana>
                説明文は運営者の確認前です。原資料とあわせてご確認ください。
              </Furigana>
            </p>
          )}
          <div className="anjo-explanation-label">
            <span data-reading-level="normal">
              <Furigana>{"かんたんな説明"}</Furigana>
            </span>
            <span data-reading-level="hard">
              <Furigana>{"くわしい説明"}</Furigana>
            </span>
            <span>
              <Furigana>{"画面上のスイッチで切り替え"}</Furigana>
            </span>
          </div>
          {(["normal", "hard"] as const).map((level) => {
            const content = bill.bill_contents.find(
              (c) => c.difficulty_level === level
            );
            return (
              <section
                key={level}
                data-reading-level={level}
                className="anjo-article"
              >
                <p className="anjo-lead">
                  <Furigana>
                    {content?.summary || "説明文を準備しています。"}
                  </Furigana>
                </p>
                <div className="anjo-markdown">
                  <AnjoMarkdown>
                    {
                      splitDeliberations(
                        content?.content || "説明文を準備しています。"
                      ).body
                    }
                  </AnjoMarkdown>
                </div>
              </section>
            );
          })}
          <AnjoDeliberations
            normal={
              bill.bill_contents.find((c) => c.difficulty_level === "normal")
                ?.content || ""
            }
            hard={
              bill.bill_contents.find((c) => c.difficulty_level === "hard")
                ?.content || ""
            }
          />
          <section className="anjo-panel">
            <h2>
              <ReadingText
                normal="もとになった資料と説明について"
                hard="出典と説明の立場"
              />
            </h2>
            {bill.shugiin_url && (
              <a
                href={bill.shugiin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="anjo-text-link"
              >
                <Furigana>公式の資料を開く</Furigana>
                <ExternalLink size={16} />
              </a>
            )}
            <p>
              <ReadingText
                normal="このページは、もとになった資料や記録をわかりやすく説明しています。市が書いた説明や、すば康貴の賛否・政治的な意見とは区別しています。"
                hard="このページは、出典に示した資料・記録に基づく編集上の説明です。市の公式見解そのものではありません。すば康貴の賛否・政治的見解は掲載していません。"
              />
            </p>
          </section>
        </div>
        <aside className="anjo-detail-aside">
          {token ? (
            <p className="anjo-note">
              <Furigana>
                {"AI質問は掲載後の議案ページで利用できます。"}
              </Furigana>
            </p>
          ) : (
            <AnjoChat
              billId={id}
              enabled={process.env.ANJO_AI_ENABLED === "true"}
            />
          )}
        </aside>
      </div>
      <BackToList query={query} bottom />
    </article>
  );
}
