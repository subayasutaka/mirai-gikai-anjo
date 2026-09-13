import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminClient, createTestBill, getAnonClient } from "../utils";
// Creates only an isolated draft; cleanup never touches actual usage records.
describe("安城の審議記録の保存とAI予約", () => {
  let billId: string;
  const usageId = randomUUID();
  beforeAll(async () => {
    billId = (
      await createTestBill({
        name: "【検証専用・非公開】審議記録",
        publish_status: "draft",
      })
    ).id;
  });
  afterAll(async () => {
    const usage = await adminClient
      .from("anjo_ai_usage")
      .delete()
      .eq("id", usageId);
    if (usage.error) throw usage.error;
    if (billId) {
      const deleted = await adminClient.from("bills").delete().eq("id", billId);
      if (deleted.error) throw deleted.error;
    }
  });
  it("公開用予約は下書きを拒否し、管理者用も匿名からは実行できない", async () => {
    const args = {
      p_id: usageId,
      p_bill_id: billId,
      p_client_hash: "d".repeat(64),
    };
    expect((await adminClient.rpc("reserve_anjo_ai_request", args)).data).toBe(
      "unavailable"
    );
    expect(
      (
        await getAnonClient().rpc("reserve_anjo_ai_request", {
          ...args,
          p_allow_draft: true,
        })
      ).error
    ).not.toBeNull();
    const result = await adminClient.rpc("reserve_anjo_ai_request", {
      ...args,
      p_allow_draft: true,
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe("allowed");
  });
  it("両方の説明とAI資料を保存し、確認済み状態を解除する", async () => {
    await adminClient
      .from("bills")
      .update({ is_review_completed: true })
      .eq("id", billId);
    const args = {
      p_bill_id: billId,
      p_normal: {
        title: "簡単",
        summary: "要約",
        content: "市内料金は変わらない",
      },
      p_hard: {
        title: "詳細",
        summary: "要旨",
        content: "市内使用料に変更なし",
      },
      p_knowledge_source: "原資料と確認済み審議記録",
    };
    expect(
      (await getAnonClient().rpc("save_anjo_bill_contents", args)).error
    ).not.toBeNull();
    expect(
      (
        await adminClient
          .from("bill_contents")
          .select("id")
          .eq("bill_id", billId)
      ).data
    ).toHaveLength(0);
    const saved = await adminClient.rpc("save_anjo_bill_contents", args);
    expect(saved.error).toBeNull();
    const bill = await adminClient
      .from("bills")
      .select(
        "publish_status,is_review_completed,knowledge_source,bill_contents(*)"
      )
      .eq("id", billId)
      .single();
    expect(bill.data?.publish_status).toBe("draft");
    expect(bill.data?.is_review_completed).toBe(false);
    expect(bill.data?.knowledge_source).toBe(args.p_knowledge_source);
    expect(bill.data?.bill_contents).toHaveLength(2);
    expect(
      bill.data?.bill_contents.find((row) => row.difficulty_level === "normal")
        ?.content
    ).toBe(args.p_normal.content);
    expect(
      bill.data?.bill_contents.find((row) => row.difficulty_level === "hard")
        ?.content
    ).toBe(args.p_hard.content);
    const changed = await adminClient.rpc("save_anjo_bill_contents", {
      ...args,
      p_normal: { title: "変更後", summary: "", content: "訂正後の質問" },
      p_hard: { title: "", summary: "", content: "" },
      p_knowledge_source: "原資料のみ",
    });
    expect(changed.error).toBeNull();
    const rows = await adminClient
      .from("bill_contents")
      .select("difficulty_level,title,content")
      .eq("bill_id", billId);
    expect(rows.data).toHaveLength(2);
    expect(
      rows.data?.find((row) => row.difficulty_level === "normal")
    ).toMatchObject({ title: "変更後", content: "訂正後の質問" });
    expect(
      rows.data?.find((row) => row.difficulty_level === "hard")
    ).toMatchObject({ title: "", content: "" });
  });
});
