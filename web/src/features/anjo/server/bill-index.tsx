import "server-only";
import { ANJO_SITE } from "@mirai-gikai/shared/anjo/config";
import {
  ANJO_DOCUMENT_KINDS,
  countAnjoDocuments,
  getAnjoDocumentKind,
  getAnjoDocumentStatus,
} from "@mirai-gikai/shared/anjo/document-kind";
import { TOPIC_CATEGORIES } from "@mirai-gikai/shared/anjo/topics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import {
  readTopicSearch,
  type TopicSearch,
  topicQuery,
} from "../shared/topic-navigation";
import {
  filterBudgetTopics,
  getTopicBillIds,
} from "../shared/utils/filter-budget-topics";
import { BrowseFilters } from "./browse-filters";
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
  const expandedBills = getTopicBillIds(topics);
  const themes = [...new Set(topics.flatMap((t) => t.content.themes))];
  const shown = filterBudgetTopics(topics, state);
  const hasFilters = Boolean(state.category || state.theme);
  const matchedBillIds = getTopicBillIds(shown);
  const shownBills = hasFilters
    ? bills.filter((b) => matchedBillIds.has(b.id))
    : bills;
  const counts = countAnjoDocuments(bills);
  const filterDescription = `${state.theme || "すべてのテーマ"} ／ ${state.category || "すべての分野"}`;
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
            公開された議案・決算・報告を、やさしい言葉で。気になる内容から読めます。
          </Furigana>
        </p>
        <p className="anjo-small">
          <Furigana>{`掲載済み ${bills.length}件（議案${counts.bill}件・決算認定${counts.certification}件・報告${counts.report}件）。予算の${topics.length}内容を個別に説明しています。予算・決算の事業別説明は一部を掲載しています。`}</Furigana>
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
          scroll={false}
          aria-current={state.view === "life" ? "page" : undefined}
        >
          <Furigana>暮らしから見る</Furigana>
        </Link>
        <Link
          href={to({ view: "bills" })}
          scroll={false}
          aria-current={state.view === "bills" ? "page" : undefined}
        >
          <Furigana>議案から見る</Furigana>
        </Link>
      </nav>
      <BrowseFilters
        state={state}
        themes={themes}
        categories={TOPIC_CATEGORIES.filter((category) =>
          topics.some((topic) => topic.content.categories.includes(category))
        )}
      />
      {state.view === "life" ? (
        <section aria-labelledby="contents-title">
          <h2 id="contents-title" className="anjo-browse-title">
            <Furigana>予算の中で変わること</Furigana>
          </h2>
          <p className="anjo-filter-result" role="status">
            <Furigana>{`${filterDescription}：${shown.length}件の内容`}</Furigana>
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
          {!hasFilters && (
            <BillGroups
              bills={bills.filter((b) => !expandedBills.has(b.id))}
              query={query}
            />
          )}
        </section>
      ) : (
        <section aria-labelledby="bills-title">
          <h2 id="bills-title" className="anjo-browse-title">
            <Furigana>提出された案件から見る</Furigana>
          </h2>
          <p>
            <Furigana>
              議案、決算認定、報告を分けて掲載しています。一つの予算議案に、複数の内容が含まれます。
            </Furigana>
          </p>
          <p className="anjo-filter-result" role="status">
            <Furigana>{`${filterDescription}：${shownBills.length}件`}</Furigana>
          </p>
          {hasFilters && (
            <p className="anjo-small">
              <Furigana>
                選んだ内容を含む議案を表示しています。議案全体には、ほかの内容も含まれます。
              </Furigana>
            </p>
          )}
          {shownBills.length ? (
            <BillGroups
              bills={shownBills}
              query={query}
              matchedTopics={hasFilters ? shown : undefined}
            />
          ) : (
            <p className="anjo-panel">
              <Furigana>
                この条件に合う議案はありません。テーマか分野の「すべて」を選ぶと条件を外せます。
              </Furigana>
            </p>
          )}
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

function BillGroups({
  bills,
  query,
  matchedTopics,
}: {
  bills: Awaited<ReturnType<typeof listAnjoBills>>;
  query: string;
  matchedTopics?: Awaited<ReturnType<typeof listAnjoTopics>>;
}) {
  return ANJO_DOCUMENT_KINDS.map(({ kind, label }) => {
    const group = bills.filter(
      (bill) => getAnjoDocumentKind(bill.name) === kind
    );
    if (!group.length) return null;
    return (
      <section key={kind} aria-label={label}>
        <h2 className="anjo-browse-title">
          <Furigana>{`${label}（${group.length}件）`}</Furigana>
        </h2>
        {kind === "certification" && (
          <p className="anjo-small">
            <Furigana>昨年度のお金の使い方や経営実績を確認します。</Furigana>
          </p>
        )}
        {kind === "report" && (
          <p className="anjo-small">
            <Furigana>
              市から議会への報告です。可決・否決を決める案件ではありません。
            </Furigana>
          </p>
        )}
        <div className="anjo-topic-grid">
          {group.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              query={query}
              matchedTopics={matchedTopics
                ?.filter((topic) =>
                  topic.anjo_topic_bills.some(
                    (link) => link.bill_id === bill.id
                  )
                )
                .map((topic) => ({ id: topic.id, title: topic.content.title }))}
            />
          ))}
        </div>
      </section>
    );
  });
}

function BillCard({
  bill,
  query,
  matchedTopics,
}: {
  bill: Awaited<ReturnType<typeof listAnjoBills>>[number];
  query: string;
  matchedTopics?: { id: string; title: string }[];
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
      {matchedTopics && (
        <div className="anjo-bill-matches">
          <p>
            <Furigana>この条件に合う内容</Furigana>
          </p>
          <ul>
            {matchedTopics.map((topic) => (
              <li key={topic.id}>
                <Furigana>{topic.title}</Furigana>
              </li>
            ))}
          </ul>
        </div>
      )}
      <span className="anjo-chip">
        <Furigana>{getAnjoDocumentStatus(bill.name, bill.status)}</Furigana>
      </span>
      <span className="anjo-topic-read">
        <Furigana>
          {getAnjoDocumentKind(bill.name) === "report"
            ? "報告の内容を見る"
            : "議案全体を見る"}
        </Furigana>
        <ArrowUpRight size={18} />
      </span>
    </Link>
  );
}
