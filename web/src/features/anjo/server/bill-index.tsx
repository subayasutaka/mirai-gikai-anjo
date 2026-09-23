import "server-only";
import { ANJO_SITE } from "@mirai-gikai/shared/anjo/config";
import {
  ANJO_DOCUMENT_KINDS,
  countAnjoDocuments,
  getAnjoDocumentKind,
  getAnjoDocumentStatus,
  isAnjoSubmissionPlanned,
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
import { getBudgetKind, getTopicScope } from "../shared/utils/budget-kind";
import {
  filterBudgetTopics,
  getTopicBillIds,
} from "../shared/utils/filter-budget-topics";
import { BrowseFilters } from "./browse-filters";
import { Furigana } from "./furigana";
import { ReadingText } from "./reading-text";
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
  const topicBills = bills.filter((bill) => expandedBills.has(bill.id));
  const topicScope = getTopicScope(topicBills.map((bill) => bill.name));
  const themes = [...new Set(topics.flatMap((t) => t.content.themes))];
  const shown = filterBudgetTopics(topics, state);
  const hasFilters = Boolean(state.category || state.theme);
  const matchedBillIds = getTopicBillIds(shown);
  const shownBills = hasFilters
    ? bills.filter((b) => matchedBillIds.has(b.id))
    : bills;
  const counts = countAnjoDocuments(bills);
  const plannedCount = bills.filter((bill) =>
    isAnjoSubmissionPlanned(bill.name, bill.status)
  ).length;
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
          <ReadingText
            normal="暮らしに、どんな変化がある？"
            hard="議案・審議情報"
          />
        </h1>
        <p>
          <Furigana>
            公表された議案・決算・人事案・報告を、やさしい言葉で。気になる内容から読めます。
          </Furigana>
        </p>
        <p className="anjo-small">
          <Furigana>{`掲載済み ${bills.length}件（議案${counts.bill}件・決算認定${counts.certification}件・人事の同意${counts.consent}件・報告${counts.report}件）。${plannedCount ? `うち${plannedCount}件は提出予定です。` : ""}予算の${topics.length}内容を個別に説明しています。予算・決算の事業別説明は一部を掲載しています。`}</Furigana>
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
          <ReadingText normal="暮らしから見る" hard="事業・内容から見る" />
        </Link>
        <Link
          href={to({ view: "bills" })}
          scroll={false}
          aria-current={state.view === "bills" ? "page" : undefined}
        >
          <ReadingText normal="議案から見る" hard="議案一覧" />
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
            <ReadingText normal={topicScope.normal} hard={topicScope.hard} />
          </h2>
          <p>
            <Furigana>{`${topicScope.explanation}${topicBills.length}議案の中から${topics.length}項目を掲載しています。`}</Furigana>
          </p>
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
              topics={topics}
            />
          )}
        </section>
      ) : (
        <section aria-labelledby="bills-title">
          <h2 id="bills-title" className="anjo-browse-title">
            <ReadingText
              normal="議会に出された案・報告の一覧"
              hard="議案・案件の一覧"
            />
          </h2>
          <p>
            <Furigana>
              予算の見直し、条例などの案、決算、委員などを選ぶ案、報告を分けて掲載しています。予算は会計ごとに1つの議案として掲載し、議案を開くと事業別の説明も読めます。
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
              topics={topics}
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
  topics,
}: {
  bills: Awaited<ReturnType<typeof listAnjoBills>>;
  query: string;
  matchedTopics?: Awaited<ReturnType<typeof listAnjoTopics>>;
  topics: Awaited<ReturnType<typeof listAnjoTopics>>;
}) {
  const labels = {
    bill: "条例などの案",
    certification: "昨年度のお金の使い方",
    consent: "委員などを選ぶ案",
    report: "市からの報告",
  };
  const groups = [
    {
      kind: "supplementary",
      label: "補正予算",
      normal: "決まっている予算を見直す案",
      bills: bills.filter(
        (bill) => getBudgetKind(bill.name) === "supplementary"
      ),
    },
    {
      kind: "initial",
      label: "当初予算",
      normal: "1年分のお金の使い道を決める案",
      bills: bills.filter((bill) => getBudgetKind(bill.name) === "initial"),
    },
    ...ANJO_DOCUMENT_KINDS.map(({ kind, label }) => ({
      kind,
      label: kind === "bill" ? "条例・意見書などの議案" : label,
      normal: labels[kind],
      bills: bills.filter(
        (bill) =>
          getAnjoDocumentKind(bill.name) === kind && !getBudgetKind(bill.name)
      ),
    })),
  ];
  return groups.map(({ kind, label, normal, bills: group }) => {
    if (!group.length) return null;
    return (
      <section
        key={kind}
        aria-labelledby={`group-${kind}`}
        data-bill-group={kind}
      >
        <h2 id={`group-${kind}`} className="anjo-browse-title">
          <ReadingText
            normal={`${normal}（${group.length}件）`}
            hard={`${label}（${group.length}件）`}
          />
        </h2>
        {kind === "supplementary" && (
          <p className="anjo-small">
            <Furigana>
              決まっている予算を変更する「補正予算」です。会計ごとに、追加額や変更内容を確認できます。
            </Furigana>
          </p>
        )}
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
        {kind === "consent" && (
          <p className="anjo-small">
            <Furigana>
              委員の選任・任命について、議会の同意を求める案件です。
            </Furigana>
          </p>
        )}
        <div className="anjo-topic-grid">
          {group.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              query={query}
              topicCount={
                topics.filter((topic) =>
                  topic.anjo_topic_bills.some(
                    (link) => link.bill_id === bill.id
                  )
                ).length
              }
              matchedTopics={matchedTopics
                ?.filter((topic) =>
                  topic.anjo_topic_bills.some(
                    (link) => link.bill_id === bill.id
                  )
                )
                .map((topic) => ({
                  id: topic.id,
                  title: topic.content.title,
                  formalTitle: topic.content.formalTitle,
                }))}
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
  topicCount,
}: {
  bill: Awaited<ReturnType<typeof listAnjoBills>>[number];
  query: string;
  matchedTopics?: { id: string; title: string; formalTitle: string }[];
  topicCount: number;
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
      {getBudgetKind(bill.name) && (
        <p className="anjo-small">
          <Furigana>
            {topicCount
              ? `議案を開くと、中の${topicCount}項目の説明も読めます（一部抜粋）。`
              : "事業別の説明は準備中です。議案全体の説明を読めます。"}
          </Furigana>
        </p>
      )}
      {matchedTopics && (
        <div className="anjo-bill-matches">
          <p>
            <Furigana>この条件に合う内容</Furigana>
          </p>
          <ul>
            {matchedTopics.map((topic) => (
              <li key={topic.id}>
                <ReadingText normal={topic.title} hard={topic.formalTitle} />
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
