"use client";
import {
  TOPIC_CATEGORIES,
  type TopicContent,
  type TopicEdit,
} from "@mirai-gikai/shared/anjo/topics";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { saveTopic } from "../server/topic-actions";

type TextKey = {
  [K in keyof TopicContent]: TopicContent[K] extends string ? K : never;
}[keyof TopicContent];
const TEXT_FIELDS: {
  key: TextKey;
  label: string;
  help?: string;
  long?: boolean;
}[] = [
  { key: "title", label: "読みやすい題名" },
  { key: "formalTitle", label: "資料上の正式名称" },
  {
    key: "summary",
    label: "かんたんな説明・一覧の要約",
    help: "誰の何がどう変わるか。重要な対象条件は省かないでください。",
  },
  { key: "description", label: "くわしい説明", long: true },
  { key: "target", label: "対象となる人・施設など" },
  {
    key: "period",
    label: "対象期間・実施時期",
    help: "年度・月までしか分からない場合は、その精度で入力します。",
  },
  {
    key: "moneyLabel",
    label: "金額が表すもの",
    help: "例：今回の追加予算、今年度分／複数年度の総額、支出の増減。",
  },
  {
    key: "moneyValue",
    label: "金額",
    help: "単位と増減を記入。不明・対象外・増減0円は区別します。",
  },
  { key: "importantNote", label: "最初から伝える重要な条件・未確認事項" },
  {
    key: "moneyDetails",
    label: "お金の内訳・財源",
    long: true,
    help: "会計間の移動を重ねて足さないでください。年度・金額の範囲・出典も記入します。",
  },
  { key: "sourceNote", label: "出典名・該当ページ・確認範囲", long: true },
  { key: "sourceUrl", label: "公式資料のリンク（https）" },
  {
    key: "knowledgeSource",
    label: "AIが参照する原資料の抜粋",
    long: true,
    help: "説明・内訳・出典・確認済み質疑も一緒にAIへ渡ります。推測を混ぜず、資料名とページを付けてください。",
  },
  {
    key: "deliberationDetails",
    label: "確認済みの質問と市の答弁（資料がない間は空欄）",
    long: true,
    help: "会議・日付 → 質問者と要点 → 市の答弁者と要点 → 未回答事項 → 出典・録音位置。空欄なら資料確認後に掲載と表示します。",
  },
  { key: "checkedOn", label: "原資料を確認した日" },
];

export function TopicForm({
  initial,
  sessions,
  bills,
  topics,
}: {
  initial: TopicEdit;
  sessions: { id: string; name: string }[];
  bills: {
    id: string;
    name: string;
    diet_session_id: string | null;
    publish_status: string;
    status_note: string | null;
  }[];
  topics: { id: string; title: string }[];
}) {
  const [form, setForm] = useState(initial);
  const [committeeKeys, setCommitteeKeys] = useState(() =>
    initial.content.committeeDates.map(() => crypto.randomUUID())
  );
  const [relationKeys, setRelationKeys] = useState(() =>
    initial.content.relatedTopics.map(() => crypto.randomUUID())
  );
  const [themesText, setThemesText] = useState(
    initial.content.themes.join("、")
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  function change(change: Partial<TopicEdit>) {
    setForm((f) => ({ ...f, ...change, reviewed: false }));
    setMessage("");
  }
  function content(changeContent: Partial<TopicContent>) {
    change({ content: { ...form.content, ...changeContent } });
  }
  return (
    <form
      className="max-w-4xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const result = await saveTopic(form);
          if (!result.success) {
            setMessage(result.error);
            return;
          }
          toast.success(
            "保存しました。閲覧画面を再読み込みして確認できます。",
            {
              duration: 8000,
            }
          );
          router.push(routes.topicEdit(result.id));
          router.refresh();
        } catch {
          setMessage(
            "保存を確認できませんでした。再読み込みして保存状態を確認してください。"
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <Link className="underline" href={routes.topics()}>
        ← 内容一覧へ
      </Link>
      <h1 className="text-2xl font-bold">
        {initial.expectedUpdatedAt
          ? "暮らしの内容を編集"
          : "暮らしの内容を追加"}
      </h1>
      <fieldset disabled={busy} className="space-y-6">
        <label className="block">
          会期
          <select
            className="block w-full border rounded p-2"
            value={form.sessionId}
            onChange={(e) => change({ sessionId: e.target.value, billIds: [] })}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="border rounded p-4 space-y-2">
          <legend>関係する正式議案（複数選べます）</legend>
          {bills
            .filter((b) => b.diet_session_id === form.sessionId)
            .map((b) => (
              <label key={b.id} className="block">
                <input
                  type="checkbox"
                  checked={form.billIds.includes(b.id)}
                  onChange={(e) =>
                    change({
                      billIds: e.target.checked
                        ? [...form.billIds, b.id]
                        : form.billIds.filter((id) => id !== b.id),
                    })
                  }
                />{" "}
                {b.name}（
                {b.publish_status === "published" ? "掲載中" : "未公開"}）
              </label>
            ))}
        </fieldset>
        <fieldset className="border rounded p-4">
          <legend>分野（主な分野と、必要なら副分野。3つまで）</legend>
          <div className="flex flex-wrap gap-4">
            {TOPIC_CATEGORIES.map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={form.content.categories.includes(c)}
                  onChange={(e) =>
                    content({
                      categories: e.target.checked
                        ? [...form.content.categories, c]
                        : form.content.categories.filter((v) => v !== c),
                    })
                  }
                />{" "}
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          テーマ（複数は読点「、」で区切る）
          <input
            className="block w-full border rounded p-2"
            value={themesText}
            onChange={(e) => {
              setThemesText(e.target.value);
              content({
                themes: e.target.value
                  .split("、")
                  .map((v) => v.trim())
                  .filter(Boolean),
              });
            }}
          />
          <span className="text-sm text-muted-foreground">
            同じ表記の内容をまとめます。例：物価高対応
          </span>
        </label>
        {TEXT_FIELDS.map((field) => (
          <label
            key={field.key}
            htmlFor={`topic-${field.key}`}
            className="block font-medium"
          >
            {field.label}
            {field.long ? (
              <textarea
                id={`topic-${field.key}`}
                className="block w-full border rounded p-3 font-normal"
                rows={field.key === "moneyDetails" ? 7 : 4}
                value={form.content[field.key]}
                onChange={(e) => content({ [field.key]: e.target.value })}
              />
            ) : (
              <input
                id={`topic-${field.key}`}
                type={
                  field.key === "checkedOn"
                    ? "date"
                    : field.key === "sourceUrl"
                      ? "url"
                      : "text"
                }
                className="block w-full border rounded p-2 font-normal"
                value={form.content[field.key]}
                onChange={(e) => content({ [field.key]: e.target.value })}
              />
            )}{" "}
            {field.help && (
              <span className="text-sm font-normal text-muted-foreground">
                {field.help}
              </span>
            )}
          </label>
        ))}
        <fieldset className="border rounded p-4 space-y-3">
          <legend>この内容に関係する委員会と日付</legend>
          <p className="text-sm">
            一般会計と水道会計など、別の委員会にまたがるときは両方を追加します。上程・本会議質疑・採決日は議案管理の情報を使います。
          </p>
          {form.content.committeeDates.map((item, index) => (
            <div key={committeeKeys[index]} className="flex flex-wrap gap-2">
              <input
                aria-label={`委員会${index + 1}の名前`}
                className="border rounded p-2"
                value={item.name}
                onChange={(e) =>
                  content({
                    committeeDates: form.content.committeeDates.map((v, i) =>
                      i === index ? { ...v, name: e.target.value } : v
                    ),
                  })
                }
              />
              <input
                aria-label={`委員会${index + 1}の日付`}
                type="date"
                className="border rounded p-2"
                value={item.date || ""}
                onChange={(e) =>
                  content({
                    committeeDates: form.content.committeeDates.map((v, i) =>
                      i === index ? { ...v, date: e.target.value || null } : v
                    ),
                  })
                }
              />
              <input
                aria-label={`委員会${index + 1}の対象・確認メモ`}
                placeholder="対象・確認メモ"
                className="border rounded p-2"
                value={item.note}
                onChange={(e) =>
                  content({
                    committeeDates: form.content.committeeDates.map((v, i) =>
                      i === index ? { ...v, note: e.target.value } : v
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCommitteeKeys((keys) =>
                    keys.filter((_, i) => i !== index)
                  );
                  content({
                    committeeDates: form.content.committeeDates.filter(
                      (_, i) => i !== index
                    ),
                  });
                }}
              >
                削除
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCommitteeKeys((keys) => [...keys, crypto.randomUUID()]);
              content({
                committeeDates: [
                  ...form.content.committeeDates,
                  { name: "", date: null, note: "" },
                ],
              });
            }}
          >
            委員会を追加
          </Button>
        </fieldset>
        <fieldset className="border rounded p-4 space-y-3">
          <legend>関連する内容・過去や次の変更</legend>
          {form.content.relatedTopics.map((item, index) => (
            <div key={relationKeys[index]} className="flex flex-wrap gap-2">
              <select
                aria-label={`関連内容${index + 1}`}
                className="border rounded p-2 max-w-full"
                value={item.id}
                onChange={(e) =>
                  content({
                    relatedTopics: form.content.relatedTopics.map((v, i) =>
                      i === index ? { ...v, id: e.target.value } : v
                    ),
                  })
                }
              >
                <option value="">内容を選択</option>
                {topics
                  .filter((t) => t.id !== form.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
              <select
                aria-label={`関連内容${index + 1}の関係`}
                className="border rounded p-2"
                value={item.relation}
                onChange={(e) =>
                  content({
                    relatedTopics: form.content.relatedTopics.map((v, i) =>
                      i === index
                        ? {
                            ...v,
                            relation: e.target.value as typeof item.relation,
                          }
                        : v
                    ),
                  })
                }
              >
                <option value="same_theme">同じテーマ</option>
                <option value="previous">前の変更</option>
                <option value="next">次の変更</option>
                <option value="similar">参考になる類似の内容</option>
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRelationKeys((keys) => keys.filter((_, i) => i !== index));
                  content({
                    relatedTopics: form.content.relatedTopics.filter(
                      (_, i) => i !== index
                    ),
                  });
                }}
              >
                削除
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRelationKeys((keys) => [...keys, crypto.randomUUID()]);
              content({
                relatedTopics: [
                  ...form.content.relatedTopics,
                  { id: "", relation: "same_theme" },
                ],
              });
            }}
          >
            関連する内容を追加
          </Button>
        </fieldset>
        <label className="block">
          掲載順（小さい順。原資料の順を基本にします）
          <input
            type="number"
            min={0}
            max={100000}
            className="block border rounded p-2"
            value={form.sortOrder}
            onChange={(e) => change({ sortOrder: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          掲載状態
          <select
            className="block border rounded p-2"
            value={form.publishStatus}
            onChange={(e) =>
              change({ publishStatus: e.target.value as "draft" | "published" })
            }
          >
            <option value="draft">下書き（閲覧画面に出さない）</option>
            <option value="published">掲載する（現在の閲覧制限内）</option>
          </select>
        </label>
        <label className="block">
          <input
            type="checkbox"
            checked={form.reviewed}
            onChange={(e) =>
              setForm((f) => ({ ...f, reviewed: e.target.checked }))
            }
          />{" "}
          原資料・対象条件・金額・質疑記録を本人が確認した
        </label>
        <p className="text-sm text-muted-foreground">
          内容を変えると確認済みのチェックは外れます。閲覧制限の解除や、新しい課金の設定はこの操作に含みません。
        </p>
        <Button type="submit">
          {busy ? "保存中…" : "内容と議案のつながりを保存"}
        </Button>
      </fieldset>
      <p role="status" className="font-bold">
        {message}
      </p>
      {initial.publishStatus === "published" && (
        <a
          className="underline"
          href={`https://mirai-gikai-anjo.vercel.app/contents/${initial.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          閲覧画面を開く ↗
        </a>
      )}
    </form>
  );
}
