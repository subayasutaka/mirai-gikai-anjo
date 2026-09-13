import { z } from "zod";
import { createAnjoPrompt } from "./ai-policy";
import { ANJO_STATUS_LABELS } from "./config";

export const TOPIC_CATEGORIES = ["福祉", "子育て", "暮らし", "まちづくり", "教育", "行政", "その他"] as const;
const short = z.string().trim().min(1).max(250);
const optionalText = z.string().trim().max(3000);
const isoDate = z.iso.date();
export const topicContentSchema = z.object({
  version: z.literal(1),
  title: short,
  formalTitle: short,
  categories: z.array(z.enum(TOPIC_CATEGORIES)).min(1).max(3),
  themes: z.array(z.string().trim().min(1).max(40)).max(5),
  summary: short,
  description: z.string().trim().min(1).max(3000),
  target: short,
  period: short,
  moneyLabel: short,
  moneyValue: short,
  importantNote: short,
  moneyDetails: z.string().trim().min(1).max(5000),
  sourceNote: z.string().trim().min(1).max(1500),
  sourceUrl: z.url().refine((value) => value.startsWith("https://"), "出典はhttpsのURLにしてください。"),
  knowledgeSource: z.string().trim().min(1).max(6000),
  committeeDates: z.array(z.object({name: short, date: isoDate.nullable(), note: z.string().max(250)})).max(6),
  deliberationDetails: optionalText,
  checkedOn: isoDate,
  relatedTopics: z.array(z.object({id: z.uuid(), relation: z.enum(["same_theme", "previous", "next", "similar"])})).max(12),
}).strict();
export type TopicContent = z.infer<typeof topicContentSchema>;
export const topicEditSchema = z.object({
  id: z.uuid(),
  sessionId: z.uuid(),
  content: topicContentSchema,
  billIds: z.array(z.uuid()).min(1).max(20).refine((ids) => new Set(ids).size === ids.length),
  publishStatus: z.enum(["draft", "published"]),
  reviewed: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
  expectedUpdatedAt: z.string().nullable(),
}).strict();
export type TopicEdit = z.infer<typeof topicEditSchema>;

export type TopicBillContext = {
  name: string; status: string; status_note: string | null;
  introduction_date: string | null; plenary_question_date: string | null;
  committee_question_date: string | null; vote_date: string | null;
};
export function topicStatusNote(bills: TopicBillContext[]) {
  return bills.map(bill => [bill.name, `登録状態：${ANJO_STATUS_LABELS[bill.status] || "確認中"}`,
    `上程：${bill.introduction_date || "未確認"}／議案質疑：${bill.plenary_question_date || "未確認"}／採決日：${bill.vote_date || "未確認"}${["enacted","rejected"].includes(bill.status)?"":"（予定・結果未確認）"}`,
    bill.status_note || "補足メモは未登録です。",
  ].join("\n")).join("\n\n");
}
export function isTopicPublic(topic: {publish_status:string;diet_session_id:string}, bills: ({publish_status:string;diet_session_id:string|null}|null)[]) {
  return topic.publish_status === "published" && bills.length > 0 && bills.every(bill => bill?.publish_status === "published" && bill.diet_session_id === topic.diet_session_id);
}

export function topicKnowledge(content: TopicContent, sessionName: string) {
  return [
    `対象会期：${sessionName}\n対象内容：${content.formalTitle}\n資料確認日：${content.checkedOn}`,
    `【編集上の説明】\n${content.summary}\n${content.description}\n対象：${content.target}\n時期：${content.period}`,
    `${content.moneyLabel}：${content.moneyValue}\n${content.importantNote}\n${content.moneyDetails}`,
    `【原資料の抜粋・出典】\n${content.knowledgeSource}\n${content.sourceNote}\n${content.sourceUrl}`,
    `【審議記録】\n${content.deliberationDetails || "質問・答弁の資料は未登録です。内容を推測しないでください。"}`,
    `【委員会の日程・確認メモ】\n${content.committeeDates.map(d=>`${d.name}：${d.date || "日付未確認"} ${d.note}`).join("\n")}`,
  ].join("\n\n");
}

export function createTopicPrompt(content: TopicContent, sessionName: string, statusNote: string, question: string) {
  return createAnjoPrompt({
    name: `${sessionName}／${content.title}`,
      status: "preparing",
      status_label: "関連する各議案の登録状態を参照",
    status_note: statusNote,
    knowledge_source: topicKnowledge(content, sessionName),
  }, question);
}

export const EMPTY_TOPIC_CONTENT: TopicContent = {
  version: 1, title: "", formalTitle: "", categories: ["その他"], themes: [],
  summary: "", description: "", target: "", period: "", moneyLabel: "今回の追加予算", moneyValue: "",
  importantNote: "", moneyDetails: "", sourceNote: "", sourceUrl: "https://anjo-shigikai.jp/know/result/r8/",
  knowledgeSource: "", committeeDates: [], deliberationDetails: "", checkedOn: "", relatedTopics: [],
};
