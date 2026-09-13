import "server-only";
import { Check, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { type readTopicSearch, topicQuery } from "../shared/topic-navigation";
import { Furigana } from "./furigana";

export function BrowseFilters({
  state,
  categories,
  themes,
}: {
  state: ReturnType<typeof readTopicSearch>;
  categories: string[];
  themes: string[];
}) {
  const active = Boolean(state.category || state.theme);
  return (
    <section className="anjo-browse-filters" aria-labelledby="filter-title">
      <div className="anjo-filter-heading">
        <h2 id="filter-title">
          <SlidersHorizontal size={18} aria-hidden="true" />
          <Furigana>予算の内容で絞り込む</Furigana>
        </h2>
        {active && (
          <Link
            scroll={false}
            className="anjo-text-link"
            href={{
              pathname: routes.home(),
              search: topicQuery({ ...state, category: "", theme: "" }),
            }}
          >
            <Furigana>すべての条件を外す</Furigana>
          </Link>
        )}
      </div>
      {(
        [
          {
            key: "theme",
            label: "テーマ",
            all: "すべてのテーマ",
            choices: themes,
          },
          {
            key: "category",
            label: "分野",
            all: "すべての分野",
            choices: categories,
          },
        ] as const
      ).map((group) => (
        <div className="anjo-filter-row" key={group.key}>
          <p id={`filter-${group.key}`} className="anjo-filter-label">
            <Furigana>{group.label}</Furigana>
          </p>
          <nav className="anjo-filter" aria-labelledby={`filter-${group.key}`}>
            {["", ...group.choices].map((value) => (
              <Link
                key={value}
                scroll={false}
                href={{
                  pathname: routes.home(),
                  search: topicQuery({ ...state, [group.key]: value }),
                }}
                aria-current={state[group.key] === value ? "true" : undefined}
              >
                {state[group.key] === value && (
                  <Check size={16} aria-hidden="true" />
                )}
                <Furigana>{value || group.all}</Furigana>
              </Link>
            ))}
          </nav>
        </div>
      ))}
    </section>
  );
}
