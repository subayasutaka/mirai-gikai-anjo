"use client";

import {
  isOperatorVote,
  OPERATOR_REASON_MAX_ITEMS,
  OPERATOR_REASONS_MAX_CHARS,
  type OperatorVote,
  parseOperatorReasons,
} from "@mirai-gikai/shared/anjo/operator-stance";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOperatorStance } from "../../server/actions/update-operator-stance";

const VOTE_OPTIONS: { value: OperatorVote | ""; label: string }[] = [
  { value: "", label: "未登録（欄には「まだ載せていません」と出ます）" },
  { value: "for", label: "賛成（人事の同意案は「同意」と表示）" },
  { value: "against", label: "反対（人事の同意案は「不同意」と表示）" },
  { value: "absent", label: "欠席" },
  { value: "left", label: "退席" },
  { value: "chair", label: "議長として表決に加わっていない" },
];

function todayInTokyo() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export function OperatorStanceForm({
  billId,
  vote,
  reasons,
  writtenOn,
}: {
  billId: string;
  vote: string | null;
  reasons: string | null;
  writtenOn: string | null;
}) {
  const [currentVote, setCurrentVote] = useState<OperatorVote | "">(
    isOperatorVote(vote) ? vote : ""
  );
  const [currentReasons, setCurrentReasons] = useState(reasons ?? "");
  const [currentWrittenOn, setCurrentWrittenOn] = useState(
    writtenOn ?? todayInTokyo()
  );
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const items = parseOperatorReasons(currentReasons);
  const chars = items.join("").length;

  const handleSubmit = () => {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await updateOperatorStance(billId, {
        vote: currentVote || null,
        reasons: currentVote ? currentReasons : "",
        writtenOn: currentVote ? currentWrittenOn : null,
      });
      if (result.success) {
        setSuccessMessage("賛否と理由を保存しました");
        if (!currentVote) setCurrentReasons("");
        router.refresh();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "保存に失敗しました");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>すば康貴の賛否と理由（運営者の意見）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            説明文やAI用の資料とは別に保存し、議案ページの「すば康貴の賛否と理由」欄に出ます。賛否は、公式の議決結果に記録されたものと同じものだけを選んでください。議決前の議案と報告案件には、登録しても出ません。
          </p>
          <div className="space-y-2">
            <Label htmlFor="operator-vote">賛否</Label>
            <select
              id="operator-vote"
              className="w-full border rounded p-3"
              value={currentVote}
              onChange={(event) =>
                setCurrentVote(
                  isOperatorVote(event.target.value) ? event.target.value : ""
                )
              }
              disabled={isPending}
            >
              {VOTE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="operator-reasons">
              理由（1行に1つ、{OPERATOR_REASON_MAX_ITEMS}つまで。合わせて
              {OPERATOR_REASONS_MAX_CHARS}字まで）
            </Label>
            <Textarea
              id="operator-reasons"
              rows={5}
              value={currentReasons}
              onChange={(event) => setCurrentReasons(event.target.value)}
              disabled={isPending || !currentVote}
            />
            <p className="text-xs text-gray-500">
              {items.length}つ・{chars}
              字。空のままなら「理由はまだ書いていません」と出ます。欠席・退席のときは、その理由を書きます。人事の同意案では候補者個人への評価は書かず、ほかの議員の名前は事実の引用に限ります。
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="operator-written-on">書いた日</Label>
            <Input
              id="operator-written-on"
              type="date"
              value={currentWrittenOn}
              onChange={(event) => setCurrentWrittenOn(event.target.value)}
              disabled={isPending || !currentVote}
            />
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              {successMessage}
            </div>
          )}
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "保存中..." : "賛否と理由を保存"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
