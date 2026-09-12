import "server-only";
import { ANJO_SITE, ANJO_STATUS_LABELS } from "@mirai-gikai/shared/anjo/config";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Landmark,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import { AnjoChat } from "../client/chat";
import { Furigana } from "./furigana";
import { AnjoProgress } from "./progress";
import { listAnjoBills } from "./repository";

export async function AnjoBillIndex() {
  const bills = await listAnjoBills();
  const featured = bills[0];
  const featuredTitle =
    featured?.bill_contents.find((c) => c.difficulty_level === "normal")
      ?.title || featured?.name;
  return (
    <>
      <div className="anjo-home-layout">
        <div className="anjo-home-content">
          <section className="anjo-hero">
            <p className="anjo-eyebrow">
              <Furigana>{"暮らしと、議会を、もっと近くに。"}</Furigana>
            </p>
            <h1>
              <span>
                <Furigana>いま、安城市議会で</Furigana>
              </span>
              <span>
                <Furigana>話し合われていること。</Furigana>
              </span>
              <em>
                <Furigana>やさしい言葉で。</Furigana>
              </em>
            </h1>
            <p className="anjo-hero-copy">
              <Furigana>
                まちのルールや、お金の使い方。まずは、気になる議案をひとつ。わからないことは、AIに聞いてみませんか。
              </Furigana>
            </p>
            <a className="anjo-primary-link" href="#bill-list-title">
              <Furigana>議案を見てみる</Furigana>
              <ArrowDown size={17} />
            </a>
            <div className="anjo-hero-art" aria-hidden="true">
              <span className="anjo-art-bubble anjo-art-bubble-one">
                <MessageCircle size={28} />
                なるほど！
              </span>
              <span className="anjo-art-council">
                <Landmark size={77} strokeWidth={1.4} />
              </span>
              <span className="anjo-art-bubble anjo-art-bubble-two">
                <Furigana>{"どう変わる？"}</Furigana>
                <Sparkles size={18} />
              </span>
              <span className="anjo-art-dot" />
            </div>
          </section>
          {featured && (
            <AnjoProgress
              status={featured.status}
              dates={featured}
              note={featured.status_note}
              sessionName={`${featured.diet_sessions?.name || "掲載議案"} / ${featured.name.split(" ")[0]}`}
            />
          )}
          <section aria-labelledby="bill-list-title" className="anjo-list">
            <div className="anjo-section-heading">
              <div>
                <p className="anjo-eyebrow">まずは、ここから</p>
                <h2 id="bill-list-title">
                  <Furigana>いま読める議案</Furigana>
                </h2>
              </div>
              <span className="anjo-count">
                {bills.length}
                <Furigana>{"件"}</Furigana>
              </span>
            </div>
            {bills.length === 0 && (
              <p className="anjo-panel">
                <Furigana>
                  掲載準備中です。運営者が原資料を確認してから掲載します。
                </Furigana>
              </p>
            )}
            {bills.map((bill) => (
              <Link
                className="anjo-bill-card"
                key={bill.id}
                href={routes.billDetail(bill.id)}
              >
                <div className="anjo-card-top">
                  <span className="anjo-chip">
                    <Furigana>{ANJO_STATUS_LABELS[bill.status]}</Furigana>
                  </span>
                  <span className="anjo-small">
                    {bill.submitted_date
                      ? formatDateWithDots(bill.submitted_date)
                      : "未登録"}{" "}
                    <Furigana>{"提出"}</Furigana>
                  </span>
                </div>
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
                <div className="anjo-card-bottom">
                  <span>
                    <BookOpen size={17} />
                    <Furigana>議案の説明を読む</Furigana>
                  </span>
                  <ArrowUpRight size={23} />
                </div>
              </Link>
            ))}
            <a
              className="anjo-text-link"
              href={ANJO_SITE.official}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Furigana>安城市議会の公式資料を見る</Furigana>
              <ArrowUpRight size={16} />
            </a>
          </section>
        </div>
        {featured && (
          <aside className="anjo-home-aside">
            <AnjoChat
              billId={featured.id}
              billTitle={<Furigana>{featuredTitle || "掲載議案"}</Furigana>}
              enabled={process.env.ANJO_AI_ENABLED === "true"}
            />
          </aside>
        )}
      </div>
      <section className="anjo-about">
        <p className="anjo-eyebrow">ABOUT</p>
        <h2>
          <Furigana>議会の話を、いつもの言葉に。</Furigana>
        </h2>
        <p>
          <Furigana>
            「難しそう」で終わらずに、暮らしとのつながりが見えてくる。公開された議案を、かんたんな説明と原資料で読むための小さな実証です。
          </Furigana>
        </p>
        <div className="anjo-about-grid">
          <div>
            <BookOpen />
            <h3>
              <Furigana>自分のペースで読む</Furigana>
            </h3>
            <p>
              <Furigana>
                「かんたん」と「くわしく」を切り替えられます。ふりがなも表示できます。
              </Furigana>
            </p>
          </div>
          <div>
            <MessageCircle />
            <h3>
              <Furigana>気になることを聞く</Furigana>
            </h3>
            <p>
              <Furigana>
                AIが登録された資料をもとに答えます。原資料へのリンクで確かめられます。
              </Furigana>
            </p>
          </div>
          <div>
            <Landmark />
            <h3>
              <Furigana>議会の今がわかる</Furigana>
            </h3>
            <p>
              <Furigana>
                議案がどこまで進んだかを表示します。議決結果は確認してから更新します。
              </Furigana>
            </p>
          </div>
        </div>
        <p className="anjo-small">
          <Furigana>
            運営：すば康貴（安城市議会議員・無所属）。伝わりやすさ、更新の手間、費用を測ります。市や議会への導入は決定していません。
          </Furigana>
        </p>
      </section>
    </>
  );
}
