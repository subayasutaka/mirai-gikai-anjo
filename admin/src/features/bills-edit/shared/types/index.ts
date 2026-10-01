import { ANJO_SOURCE_MAX_BYTES } from "@mirai-gikai/shared/anjo/config";
import { isProgressDate } from "@mirai-gikai/shared/anjo/progress-dates";
import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

// 既存の型を再利用
export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];
export type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];

// 公開ステータス型
export type BillPublishStatus = "draft" | "published" | "coming_soon";

const progressDateSchema = z
  .string()
  .refine(isProgressDate, "実在する日付を YYYY-MM-DD 形式で入力してください")
  .nullable()
  .optional();

// 共通のバリデーションスキーマ
const billBaseSchema = z.object({
  introduction_date: progressDateSchema,
  plenary_question_date: progressDateSchema,
  committee_question_date: progressDateSchema,
  vote_date: progressDateSchema,
  name: z
    .string()
    .min(1, "議案名は必須です")
    .max(200, "議案名は200文字以内で入力してください"),
  status: z.enum([
    "preparing",
    "introduced",
    "in_originating_house",
    "in_receiving_house",
    "enacted",
    "rejected",
  ]),
  originating_house: z.enum(["ANJO", "HR", "HC"]),
  status_note: z
    .string()
    .max(500, "ステータス備考は500文字以内で入力してください")
    .nullable(),
  submitted_date: z
    .string()
    .refine(
      (val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val),
      "議案提出日は YYYY-MM-DD 形式で入力してください"
    )
    .optional(),
  thumbnail_url: z.string().nullable().optional(),
  share_thumbnail_url: z.string().nullable().optional(),
  shugiin_url: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .refine((val) => val === null || /^https:\/\//.test(val), {
      message: "有効なURLを入力してください",
    })
    .optional(),
  is_featured: z.boolean(),
  is_review_completed: z.boolean(),
  diet_session_id: z.string().uuid().nullable().optional(),
  slug: z
    .string()
    .max(200, "slugは200文字以内で入力してください")
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  knowledge_source: z
    .string()
    .refine(
      (value) =>
        new TextEncoder().encode(value).length <= ANJO_SOURCE_MAX_BYTES,
      "AI用資料を短くしてください。日本語で約3,000文字が目安です。"
    )
    .optional(),
  use_knowledge_source_in_chat: z.boolean().optional(),
});

// 更新用スキーマ（既存）
export const billUpdateSchema = billBaseSchema;
export type BillUpdateInput = z.infer<typeof billUpdateSchema>;

// 新規作成用スキーマ
export const billCreateSchema = billBaseSchema;
export type BillCreateInput = z.infer<typeof billCreateSchema>;
