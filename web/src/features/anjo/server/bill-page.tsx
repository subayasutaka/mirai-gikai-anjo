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
import { splitOperatorStance } from "../shared/utils/operator-stance";
import { BackToList } from "./back-to-list";
import { AnjoDecision } from "./decision";
import { AnjoDeliberations } from "./deliberations";
import { AnjoMarkdown, Furigana } from "./furigana";
import { AnjoOperatorStance } from "./operator-stance";
import { AnjoProgress } from "./progress";
import { ReadingMarkdown, ReadingText } from "./reading-text";
import { getAnjoBill } from "./repository";
import { ThemePhoto } from "./theme-photo";
import { TopicCard } from "./topic-card";
import { listAnjoTopics } from "./topic-repository";

const POLICY_TEXT = {
  normal: `このページは、市と議会が公開した資料や記録をもとに、安城市議会議員のすば康貴が書いています。

- 議案の説明は、資料の中身を言いかえたものです。だれの賛成・反対の考えも入れていません。
- 議員の質問や意見は、発言した議員全員を、発言した順に、同じ形で短くまとめています。すば康貴の発言も同じ形です。
- 議員ごとの賛成・反対は、議会が公表した結果をそのまま写しています。
- すば康貴自身の賛成・反対と理由は、「すば康貴の賛否と理由」の欄にだけ書いています。この欄は運営者の意見です。

**選挙のとき**：運営者のすば康貴が立候補する選挙では、選挙が始まる日（告示日）から投票日までは、新しい記事や記録を載せません。この間に誤りが見つかったときは、直します。直したところと日付は、ページに残します。`,
  hard: `このページは、出典に示した公開資料・記録に基づき、安城市議会議員すば康貴が作成した編集上の説明です。市や議会の公式見解ではありません。

- 議案の説明：資料の内容の要約です。賛否や評価は含めていません。
- 議案質疑・委員会質疑・討論・一般質問：発言者全員を、発言順・同一形式・同じ字数の目安で要約しています（すば康貴の発言を含む）。
- 議員別の賛否：安城市議会の公式の議決結果の転記です。
- 運営者すば康貴の賛否と理由は、「すば康貴の賛否と理由」欄にのみ掲載しています。同欄は運営者個人の意見です。

**選挙時の運用**：運営者が立候補する選挙の告示日から投票日までの間は、新規の掲載・更新を行いません。ただし、誤りが判明した場合の訂正は行い、訂正箇所と訂正日をページに明記します。`,
};

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
        committeeOmitted={bill.committee_omitted}
        plenaryNoQuestions={bill.plenary_no_questions}
        committeeCount={bill.committee_count}
        committeeEndDate={bill.committee_question_end_date}
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
                        splitOperatorStance(
                          content?.content || "説明文を準備しています。"
                        ).body
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
          <AnjoOperatorStance
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
                normal="このページの書き方"
                hard="出典と掲載の方針"
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
            <div className="anjo-markdown anjo-policy-text">
              <ReadingMarkdown
                normal={POLICY_TEXT.normal}
                hard={POLICY_TEXT.hard}
              />
            </div>
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
