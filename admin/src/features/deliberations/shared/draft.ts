import { z } from "zod";

export const deliberationDraftSchema = z.object({
  cleanedText: z.string().max(16000),
  pairs: z
    .array(
      z.object({
        time: z.string().max(40),
        questioner: z.string().trim().min(1).max(100),
        question: z.string().trim().min(1).max(1000),
        respondent: z.string().trim().min(1).max(100),
        answer: z.string().trim().min(1).max(1500),
      })
    )
    .max(20),
  cautions: z.array(z.string().max(300)).max(20),
});
export type DeliberationDraft = z.infer<typeof deliberationDraftSchema>;
export const RECORD_START = "<!-- anjo-deliberation:start -->";
export const RECORD_END = "<!-- anjo-deliberation:end -->";
const escaped = (text: string) => text.replace(/[\\`*_{}[\]<>#]/g, "\\$&");

export function formatDeliberation(
  date: string,
  stage: string,
  draft: DeliberationDraft
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new Error("審議日を入力してください。");
  if (!["上程", "議案質疑", "委員会質疑", "採決"].includes(stage))
    throw new Error("審議段階を選んでください。");
  const validated = deliberationDraftSchema.parse(draft);
  if (!validated.pairs.length)
    throw new Error("質問と答弁を1組以上確認してください。");
  const displayDate = date.split("-").map(Number).join(".");
  return `${RECORD_START}\n## 審議での質問と市の答弁\n\n### ${displayDate} ${stage}\n\n運営者が録音と照合して編集した要約です。公式会議録の逐語引用ではありません。\n\n${validated.pairs
    .map(
      (pair, index) =>
        `#### ${index + 1}. ${escaped(pair.questioner)}の質問\n\n${escaped(pair.question)}\n\n**市の答弁（${escaped(pair.respondent)}）**\n\n${escaped(pair.answer)}\n\n録音の位置：${escaped(pair.time || "未確認")}`
    )
    .join("\n\n")}\n${RECORD_END}`;
}

export function extractDeliberations(content: string) {
  const records = [
    ...content.matchAll(
      /<!-- anjo-deliberation:start -->([\s\S]*?)<!-- anjo-deliberation:end -->/g
    ),
  ];
  return records.map((match) => match[1].trim()).join("\n\n");
}

export function mergeKnowledgeWithDeliberations(
  knowledge: string,
  content: string
) {
  const marker = "\n【運営者が確認した審議記録】\n";
  const original = knowledge.split(marker)[0];
  const records = extractDeliberations(content);
  return records ? original + marker + records : original;
}
