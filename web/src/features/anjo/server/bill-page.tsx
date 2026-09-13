import "server-only";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import { AnjoChat } from "../client/chat";
import { InitialDifficulty } from "../client/reading-preferences";
import { AnjoMarkdown, Furigana } from "./furigana";
import { AnjoProgress } from "./progress";
import { TopicCard } from "./topic-card";
import { listAnjoTopics } from "./topic-repository";
import {
  type TopicSearch,
  readTopicSearch,
  topicQuery,
} from "../shared/topic-navigation";
import { getAnjoBill } from "./repository";

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
  const topics = (await listAnjoTopics()).filter((t) =>
    t.anjo_topic_bills.some((link) => link.bill_id === id)
  );
  const query = topicQuery(readTopicSearch(search));
  return (
    <article>
      <InitialDifficulty difficulty={difficulty} />
      <Link
        className="anjo-text-link"
        href={{ pathname: routes.home(), search: query }}
      >
        ← <Furigana>議案一覧へ</Furigana>
      </Link>
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
          <Furigana>{"提出日："}</Furigana>
          {bill.submitted_date ? (
            formatDateWithDots(bill.submitted_date)
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
      {topics.length > 0 && (
        <p className="anjo-panel anjo-lead">
          <Furigana>
            {bill.bill_contents.find((c) => c.difficulty_level === "normal")
              ?.summary || ""}
          </Furigana>
        </p>
      )}
      {topics.length > 0 && (
        <section className="anjo-bill-topics">
          <h2 className="anjo-browse-title">
            <Furigana>この議案に含まれる内容</Furigana>
          </h2>
          <p className="anjo-small">
            <Furigana>{`${topics.length}内容を個別に説明しています。一部抜粋のため、カードの金額を足して議案全体の総額にはしないでください。`}</Furigana>
          </p>
          <div className="anjo-topic-grid">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} query={query} />
            ))}
          </div>
        </section>
      )}
      <AnjoProgress status={bill.status} note={bill.status_note} dates={bill} />
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
                    {content?.content || "説明文を準備しています。"}
                  </AnjoMarkdown>
                </div>
              </section>
            );
          })}
          <section className="anjo-panel">
            <h2>
              <Furigana>出典と説明の立場</Furigana>
            </h2>
            {bill.shugiin_url && (
              <a
                href={bill.shugiin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="anjo-text-link"
              >
                <Furigana>公式の議案書を開く</Furigana>
                <ExternalLink size={16} />
              </a>
            )}
            <p>
              <Furigana>
                このページは公開資料に基づく編集上の説明です。市の公式見解そのものではありません。すば康貴の賛否・政治的見解は、このページには掲載していません。
              </Furigana>
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
    </article>
  );
}
