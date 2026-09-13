import "server-only";
import { ANJO_SITE, ANJO_STATUS_LABELS } from "@mirai-gikai/shared/anjo/config";
import { TOPIC_CATEGORIES } from "@mirai-gikai/shared/anjo/topics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import {
  type TopicSearch,
  readTopicSearch,
  topicQuery,
} from "../shared/topic-navigation";
import { Furigana } from "./furigana";
import { listAnjoBills } from "./repository";
import { TopicCard } from "./topic-card";
import { listAnjoTopics } from "./topic-repository";

export async function AnjoBillIndex({ search = {} }: { search?: TopicSearch }) {
  const [allBills, allTopics] = await Promise.all([
    listAnjoBills(),
    listAnjoTopics(),
  ]);
  const sessions = [
    ...new Map(
      allBills
        .filter((b) => b.diet_session_id)
        .map((b) => [b.diet_session_id, b.diet_sessions])
    ).entries(),
  ].sort((a, b) =>
    (b[1]?.start_date ?? "").localeCompare(a[1]?.start_date ?? "")
  );
  const state = readTopicSearch(search);
  const session = sessions.find(([id]) => id === state.session) ?? sessions[0];
  state.session = session?.[0] ?? "";
  const bills = allBills
    .filter((b) => !session || b.diet_session_id === session[0])
    .sort((a, b) => a.name.localeCompare(b.name, "ja", { numeric: true }));
  const topics = allTopics.filter(
    (t) => !session || t.diet_session_id === session[0]
  );
  const expandedBills = new Set(
    topics.flatMap((t) => t.anjo_topic_bills.map((link) => link.bill_id))
  );
  const themes = [...new Set(topics.flatMap((t) => t.content.themes))];
  const shown = topics.filter(
    (t) =>
      (!state.category ||
        t.content.categories.includes(
          state.category as (typeof TOPIC_CATEGORIES)[number]
        )) &&
      (!state.theme || t.content.themes.includes(state.theme))
  );
  const query = topicQuery(state);
  const to = (change: Partial<typeof state>) => ({
    pathname: routes.home(),
    search: topicQuery({ ...state, ...change }),
  });
  return (
    <>
      <header className="anjo-browse-heading">
        <p className="anjo-eyebrow">
          <Furigana>{session?.[1]?.name || "安城市議会"}</Furigana>
        </p>
        <h1>
          <Furigana>暮らしに、どんな変化がある？</Furigana>
        </h1>
        <p>
          <Furigana>
            公開された議案を、やさしい言葉で。気になる内容から読めます。
          </Furigana>
        </p>
        <p className="anjo-small">
          <Furigana>{`掲載済み ${bills.length}議案。うち予算の${topics.length}内容を個別に説明しています。全議案・全事業を網羅したものではありません。`}</Furigana>
        </p>
      </header>
      {sessions.length > 1 && (
        <nav className="anjo-filter" aria-label="会期を選ぶ">
          {sessions.map(([id, s]) => (
            <Link
              key={id}
              href={to({ session: id ?? "", category: "", theme: "" })}
              aria-current={id === state.session ? "page" : undefined}
            >
              <Furigana>{s?.name || "会期未登録"}</Furigana>
            </Link>
          ))}
        </nav>
      )}
      <nav className="anjo-view-tabs" aria-label="探し方を選ぶ">
        <Link
          href={to({ view: "life" })}
          aria-current={state.view === "life" ? "page" : undefined}
        >
          <Furigana>暮らしから見る</Furigana>
        </Link>
        <Link
          href={to({ view: "bills" })}
          aria-current={state.view === "bills" ? "page" : undefined}
        >
          <Furigana>{`議案から見る（${bills.length}件）`}</Furigana>
        </Link>
      </nav>
      {state.view === "life" ? (
        <section aria-labelledby="contents-title">
          <h2 id="contents-title" className="anjo-browse-title">
            <Furigana>予算の中で変わること</Furigana>
          </h2>
          <nav className="anjo-filter" aria-label="分野で絞り込む">
            <Link
              href={to({ category: "" })}
              aria-current={!state.category ? "page" : undefined}
            >
              <Furigana>すべての分野</Furigana>
            </Link>
            {TOPIC_CATEGORIES.filter((c) =>
              topics.some((t) => t.content.categories.includes(c))
            ).map((c) => (
              <Link
                key={c}
                href={to({ category: c })}
                aria-current={state.category === c ? "page" : undefined}
              >
                <Furigana>{c}</Furigana>
              </Link>
            ))}
          </nav>
          <nav
            className="anjo-filter anjo-theme-filter"
            aria-label="テーマで絞り込む"
          >
            {themes.map((theme) => (
              <Link
                key={theme}
                href={to({ theme: state.theme === theme ? "" : theme })}
                aria-current={state.theme === theme ? "page" : undefined}
              >
                <Furigana>{`${theme} ${topics.filter((t) => t.content.themes.includes(theme)).length}件${state.theme === theme ? "・解除" : ""}`}</Furigana>
              </Link>
            ))}
          </nav>
          <p className="anjo-small" role="status">
            <Furigana>{`${state.category || "すべての分野"}${state.theme ? ` × ${state.theme}` : ""}：${shown.length}内容。資料の掲載順を基本に表示。`}</Furigana>
          </p>
          {shown.length ? (
            <div className="anjo-topic-grid">
              {shown.map((topic) => (
                <TopicCard key={topic.id} topic={topic} query={query} />
              ))}
            </div>
          ) : (
            <p className="anjo-panel">
              <Furigana>この条件に合う内容はありません。</Furigana>{" "}
              <Link
                className="anjo-text-link"
                href={to({ category: "", theme: "" })}
              >
                <Furigana>絞り込みを解除する</Furigana>
              </Link>
            </p>
          )}
          <h2 className="anjo-browse-title">
            <Furigana>条例や、そのほかの議案</Furigana>
          </h2>
          <div className="anjo-topic-grid">
            {bills
              .filter((b) => !expandedBills.has(b.id))
              .map((b) => (
                <BillCard key={b.id} bill={b} query={query} />
              ))}
          </div>
          <p className="anjo-small">
            <Furigana>
              分野・テーマの絞り込みは、上の「予算の中で変わること」が対象です。
            </Furigana>
          </p>
        </section>
      ) : (
        <section aria-labelledby="bills-title">
          <h2 id="bills-title" className="anjo-browse-title">
            <Furigana>採決する単位で見る</Furigana>
          </h2>
          <p>
            <Furigana>
              一つの予算議案に、複数の内容が含まれます。同じ内容が二つの会計にまたがる場合もあります。
            </Furigana>
          </p>
          <div className="anjo-topic-grid">
            {bills.map((b) => (
              <BillCard key={b.id} bill={b} query={query} />
            ))}
          </div>
        </section>
      )}
      <p className="anjo-browse-source">
        <a
          className="anjo-text-link"
          href={ANJO_SITE.official}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Furigana>安城市議会の公式資料を見る</Furigana>
          <ArrowUpRight size={16} />
        </a>
      </p>
    </>
  );
}

function BillCard({
  bill,
  query,
}: {
  bill: Awaited<ReturnType<typeof listAnjoBills>>[number];
  query: string;
}) {
  return (
    <Link
      href={`${routes.billDetail(bill.id)}${query}`}
      className="anjo-topic-card"
    >
      <p className="anjo-eyebrow">
        <Furigana>{bill.name.split(" ")[0]}</Furigana>
      </p>
      {(["normal", "hard"] as const).map((level) => {
        const content = bill.bill_contents.find(
          (c) => c.difficulty_level === level
        );
        return (
          <div key={level} data-reading-level={level}>
            <h3>
              <Furigana>{content?.title || bill.name}</Furigana>
            </h3>
            <p>
              <Furigana>
                {content?.summary || "説明文を準備しています。"}
              </Furigana>
            </p>
          </div>
        );
      })}
      <span className="anjo-chip">
        <Furigana>{ANJO_STATUS_LABELS[bill.status]}</Furigana>
      </span>
      <span className="anjo-topic-read">
        <Furigana>議案全体を見る</Furigana>
        <ArrowUpRight size={18} />
      </span>
    </Link>
  );
}
