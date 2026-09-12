"use client";
import { ArrowUpRight, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { CHAT_COPY } from "../shared/ui-text";
import { type ReadingMap, rehypeReadings } from "../shared/utils/furigana";
import { RubyText } from "./reading-preferences";

export function AnjoChat({
  billId,
  enabled,
  billTitle,
}: {
  billId: string;
  enabled: boolean;
  billTitle?: ReactNode;
}) {
  const [question, setQuestion] = useState("");
  const [readings, setReadings] = useState<ReadingMap>({});
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const response = await fetch("/api/anjo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, question }),
      });
      const result = await response.json();
      setReadings(result.readings || {});
      if (!response.ok) throw new Error(result.error || CHAT_COPY.failed);
      setAnswer(result.answer);
      setReadings(result.readings || {});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : CHAT_COPY.communicationFailed
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="anjo-chat" aria-labelledby="ask-title">
      <div className="anjo-chat-heading">
        <span className="anjo-chat-icon">
          <MessageCircle size={24} />
        </span>
        <div>
          <p className="anjo-eyebrow">あなたの「？」から</p>
          <h2 id="ask-title">
            <RubyText>{CHAT_COPY.title}</RubyText>
          </h2>
        </div>
      </div>
      {billTitle && (
        <Link className="anjo-chat-bill" href={routes.billDetail(billId)}>
          <span>
            <RubyText>{CHAT_COPY.scope}</RubyText>
          </span>
          <strong>{billTitle}</strong>
          <ArrowUpRight size={16} />
        </Link>
      )}
      <p>
        <RubyText>{CHAT_COPY.disclaimer}</RubyText>
      </p>
      {!enabled && (
        <p className="anjo-note">
          <RubyText>{CHAT_COPY.unavailable}</RubyText>
        </p>
      )}
      <fieldset className="anjo-question-examples" aria-label="質問の例">
        {[
          CHAT_COPY.changeQuestion,
          CHAT_COPY.dateQuestion,
          CHAT_COPY.statusQuestion,
        ].map((example) => (
          <Button
            key={example}
            type="button"
            variant="outline"
            disabled={!enabled || busy}
            onClick={() => setQuestion(example)}
          >
            <RubyText>{example}</RubyText>
          </Button>
        ))}
      </fieldset>
      <form onSubmit={ask}>
        <label htmlFor="anjo-question">
          <RubyText>{CHAT_COPY.inputLabel}</RubyText>
        </label>
        <textarea
          id="anjo-question"
          required
          maxLength={500}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例：いつから変わりますか？"
          disabled={!enabled || busy}
        />
        <Button type="submit" disabled={!enabled || busy || !question.trim()}>
          <RubyText>{busy ? CHAT_COPY.busy : CHAT_COPY.submit}</RubyText>
          <Send size={16} />
        </Button>
      </form>
      <div aria-live="polite">
        {error && (
          <div role="alert" className="anjo-note">
            <ReactMarkdown skipHtml rehypePlugins={[rehypeReadings(readings)]}>
              {error}
            </ReactMarkdown>
          </div>
        )}
        {answer && (
          <div className="anjo-answer">
            <strong>
              <RubyText>{CHAT_COPY.answerTitle}</RubyText>
            </strong>
            <div className="anjo-markdown">
              <ReactMarkdown
                skipHtml
                rehypePlugins={[rehypeReadings(readings)]}
              >
                {answer}
              </ReactMarkdown>
            </div>
            <p className="anjo-small">
              <RubyText>{CHAT_COPY.answerNote}</RubyText>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
