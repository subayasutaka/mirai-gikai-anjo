"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { draftDeliberation } from "../server/draft-action";
import { type DeliberationDraft, formatDeliberation } from "../shared/draft";

export function DeliberationImporter({
  billId,
  localAudioEnabled,
  onAppend,
}: {
  billId: string;
  localAudioEnabled: boolean;
  onAppend: (markdown: string) => void;
}) {
  const [transcript, setTranscript] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [draft, setDraft] = useState<DeliberationDraft | null>(null);
  const [busy, setBusy] = useState<"audio" | "draft" | null>(null);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [date, setDate] = useState("");
  const [stage, setStage] = useState("委員会質疑");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  async function importAudio(file: File) {
    if (file.size > 250 * 1024 * 1024) {
      setMessage("録音は250MB以内にしてください。");
      return;
    }
    setBusy("audio");
    setMessage("Macで文字起こし中です。長い録音は数十分かかる場合があります。");
    const controller = new AbortController();
    abort.current = controller;
    try {
      const data = new FormData();
      data.append("audio", file);
      const response = await fetch("/api/anjo-transcribe", {
        method: "POST",
        body: data,
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "文字起こしに失敗しました。");
      setTranscript(result.text);
      setExcerpt(result.text.length <= 6000 ? result.text : "");
      setDraft(null);
      setConfirmed(false);
      setMessage(
        "文字起こしを読み込みました。該当議案の部分を選び、下書きを作成してください。"
      );
    } catch (error) {
      setMessage(
        controller.signal.aborted
          ? "中止しました。"
          : error instanceof Error
            ? error.message
            : "文字起こしに失敗しました。"
      );
    } finally {
      setBusy(null);
      abort.current = null;
    }
  }
  async function makeDraft() {
    setBusy("draft");
    setMessage("");
    setConfirmed(false);
    setDraft(null);
    try {
      const result = await draftDeliberation(billId, excerpt);
      if (result.draft) setDraft(result.draft);
      else setMessage(result.error || "作成できませんでした。");
    } catch {
      setMessage(
        "接続を確認して、もう一度お試しください。入力文は残っています。"
      );
    } finally {
      setBusy(null);
    }
  }
  function updatePair(
    index: number,
    key: keyof DeliberationDraft["pairs"][number],
    value: string
  ) {
    setConfirmed(false);
    setDraft((previous) =>
      previous
        ? {
            ...previous,
            pairs: previous.pairs.map((pair, i) =>
              i === index ? { ...pair, [key]: value } : pair
            ),
          }
        : null
    );
  }
  function downloadTranscript() {
    const url = URL.createObjectURL(
      new Blob([transcript], { type: "text/plain;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    const stamp = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(new Date())
      .replace(/\D/g, "");
    link.download = `審議の文字起こし_${stamp}版.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <details className="mb-8 rounded-lg border p-5">
      <summary className="cursor-pointer text-lg font-semibold">
        録音・文字起こしから審議記録を追加
      </summary>
      <div className="mt-4 space-y-5">
        <p className="text-sm text-gray-600">
          録音を文字にし、質問と市の答弁の下書きを作ります。氏名・数字・発言の趣旨は必ず録音と照合してください。ここで作成しただけでは保存・掲載されません。
        </p>
        <div className="space-y-2">
          <label htmlFor="deliberation-audio" className="block font-medium">
            1. 録音を読み込む（250MB・2時間以内）
          </label>
          <Input
            id="deliberation-audio"
            type="file"
            accept="audio/*,video/mp4"
            disabled={!localAudioEnabled || !!busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importAudio(file);
              event.target.value = "";
            }}
          />
          <p className="text-sm text-gray-600">
            {localAudioEnabled
              ? "音声はこのMacで処理します。音声認識のAPI料金は0円です。"
              : "音声の処理はMacの管理画面（localhost:3001）で利用できます。こちらでは文字起こしのファイルを読み込めます。"}
          </p>
          {busy === "audio" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => abort.current?.abort()}
            >
              文字起こしを中止
            </Button>
          )}
          <label htmlFor="deliberation-text" className="block text-sm">
            文字起こしファイルがある場合（TXT・VTT・SRT）
          </label>
          <Input
            id="deliberation-text"
            type="file"
            accept=".txt,.vtt,.srt"
            disabled={!!busy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) {
                if (file.size > 2 * 1024 * 1024) {
                  setMessage("文字起こしファイルは2MB以内にしてください。");
                  return;
                }
                const text = await file.text();
                setTranscript(text);
                setExcerpt(text.length <= 6000 ? text : "");
                setDraft(null);
                setConfirmed(false);
              }
              event.target.value = "";
            }}
          />
        </div>
        {transcript && (
          <details>
            <summary className="cursor-pointer">文字起こし全文を確認</summary>
            <Textarea
              aria-label="文字起こし全文"
              value={transcript}
              readOnly
              className="mt-2 min-h-60"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={downloadTranscript}
            >
              文字起こしを保存
            </Button>
          </details>
        )}
        <div className="space-y-2">
          <label htmlFor="deliberation-excerpt" className="block font-medium">
            2. この議案に関係する部分（6000文字以内）
          </label>
          <Textarea
            id="deliberation-excerpt"
            value={excerpt}
            onChange={(event) => {
              setExcerpt(event.target.value);
              setDraft(null);
              setConfirmed(false);
            }}
            disabled={!!busy}
            className="min-h-40"
            placeholder="全文から該当部分をコピーするか、文字起こしを貼り付けてください。"
          />
          <p className="text-sm text-gray-600">
            {excerpt.length} /
            6000文字。下書きの作成時、この部分と議案名をAIへ送信します。AI質問と共通の上限（1日10回・月100回、予約上限1米ドル／月）の範囲で利用します。
          </p>
          <Button
            type="button"
            onClick={() => void makeDraft()}
            disabled={!!busy || !excerpt.trim() || excerpt.length > 6000}
          >
            {busy === "draft" ? "下書きを作成中…" : "質問・答弁の下書きを作成"}
          </Button>
        </div>
        {draft && (
          <div className="space-y-4">
            <h3 className="font-semibold">3. 録音と照合して修正</h3>
            <details>
              <summary className="cursor-pointer">
                整文化した全文（掲載されません）
              </summary>
              <Textarea
                aria-label="整文化した全文"
                value={draft.cleanedText}
                onChange={(event) =>
                  setDraft({ ...draft, cleanedText: event.target.value })
                }
                className="mt-2 min-h-48"
              />
            </details>
            {draft.cautions.length > 0 && (
              <div className="rounded-md bg-orange-50 p-3 text-sm">
                <p className="font-semibold">AIが挙げた確認点</p>
                <ul className="list-inside list-disc">
                  {draft.cautions.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor="deliberation-date">
                審議日
                <Input
                  id="deliberation-date"
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setConfirmed(false);
                  }}
                />
              </label>
              <label>
                審議段階
                <select
                  className="block w-full rounded border p-2"
                  value={stage}
                  onChange={(event) => {
                    setStage(event.target.value);
                    setConfirmed(false);
                  }}
                >
                  {["上程", "議案質疑", "委員会質疑", "採決"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            {draft.pairs.map((pair, index) => (
              <fieldset
                key={`${index}-${draft.pairs.length}`}
                className="space-y-3 rounded-lg border p-4"
              >
                <legend>質問と答弁 {index + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label htmlFor={`pair-questioner-${index}`}>
                    質問者
                    <Input
                      id={`pair-questioner-${index}`}
                      value={pair.questioner}
                      onChange={(event) =>
                        updatePair(index, "questioner", event.target.value)
                      }
                    />
                  </label>
                  <label htmlFor={`pair-respondent-${index}`}>
                    市の答弁者
                    <Input
                      id={`pair-respondent-${index}`}
                      value={pair.respondent}
                      onChange={(event) =>
                        updatePair(index, "respondent", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label htmlFor={`pair-question-${index}`}>
                  質問の要約
                  <Textarea
                    id={`pair-question-${index}`}
                    value={pair.question}
                    onChange={(event) =>
                      updatePair(index, "question", event.target.value)
                    }
                  />
                </label>
                <label htmlFor={`pair-answer-${index}`}>
                  市の答弁の要約
                  <Textarea
                    id={`pair-answer-${index}`}
                    value={pair.answer}
                    onChange={(event) =>
                      updatePair(index, "answer", event.target.value)
                    }
                  />
                </label>
                <label htmlFor={`pair-time-${index}`}>
                  録音の位置
                  <Input
                    id={`pair-time-${index}`}
                    value={pair.time}
                    onChange={(event) =>
                      updatePair(index, "time", event.target.value)
                    }
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraft({
                      ...draft,
                      pairs: draft.pairs.filter((_, i) => i !== index),
                    });
                    setConfirmed(false);
                  }}
                >
                  この組を除く
                </Button>
              </fieldset>
            ))}
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                氏名、質問と答弁の対応、数字、日付を録音と照合しました。確認できない点は未確認と明記しました。
              </span>
            </label>
            <Button
              type="button"
              disabled={!confirmed || !draft.pairs.length}
              onClick={() => {
                try {
                  onAppend(formatDeliberation(date, stage, draft));
                  setDraft(null);
                  setConfirmed(false);
                  setMessage(
                    "両方の説明文の末尾に追加しました。下の内容を確認し「保存」を押してください。掲載中の議案は、保存すると閲覧画面にも反映されます。"
                  );
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "入力を確認してください。"
                  );
                }
              }}
            >
              確認した記録を説明文に追加
            </Button>
          </div>
        )}
        {message && (
          <p role="status" className="rounded-md bg-gray-50 p-3 text-sm">
            {message}
          </p>
        )}
      </div>
    </details>
  );
}
