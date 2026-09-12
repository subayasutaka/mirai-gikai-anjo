"use client";
import { ANJO_STATUS_LABELS } from "@mirai-gikai/shared/anjo/config";
import type { Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import type { BillCreateInput } from "../../shared/types";

export function BillFormFields({
  control,
  dietSessions,
}: {
  control: Control<BillCreateInput>;
  billId?: string;
  dietSessions: DietSession[];
}) {
  return (
    <>
      <p className="text-sm text-gray-600">
        対象：安城市議会。原資料で確認した事実を入力し、政治的な見解は混ぜないでください。
      </p>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>議案番号と正式名称 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>審議状況 *</FormLabel>
            <FormControl>
              <select {...field} className="w-full border rounded p-3">
                {Object.entries(ANJO_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormDescription>
              上程 → 議案質疑 → 委員会質疑 →
              採決の順です。進んだ段階を選び、補足欄に確認日と根拠を書いてください。採決の結果は公式資料で確認してから変更します。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="status_note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>審議状況の補足・確認日</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="submitted_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>議案提出日 *</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="diet_session_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>会期</FormLabel>
            <FormControl>
              <select
                value={field.value || ""}
                onChange={(event) => field.onChange(event.target.value || null)}
                className="w-full border rounded p-3"
              >
                <option value="">選択してください</option>
                {dietSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="shugiin_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>公式の議案書URL *</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                placeholder="https://anjo-shigikai.jp/..."
              />
            </FormControl>
            <FormDescription>
              PDFは #page=6 のように参照ページも指定できます。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="knowledge_source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>AIが参照する原資料の内容</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ""}
                className="min-h-60"
              />
            </FormControl>
            <FormDescription>
              日本語で約3,000文字を目安に、公式資料の該当箇所・ページ・出典URL・確認日を入力します。未確認情報や非公開情報を入れないでください。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="use_knowledge_source_in_chat"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel>この議案でAIへの質問を受け付ける</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="is_review_completed"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel>運営者が原資料との照合を完了した</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
