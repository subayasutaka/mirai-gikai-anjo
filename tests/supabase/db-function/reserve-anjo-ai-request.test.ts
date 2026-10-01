import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminClient, createTestBill, getAnonClient } from "../utils";

// Initial isolated verification only: never clear or overwrite real usage records.
// Run before enabling AI, with ANJO_RUN_INITIAL_DB_TESTS=true.
describe.skipIf(process.env.ANJO_RUN_INITIAL_DB_TESTS !== "true")(
  "reserve_anjo_ai_request 初期接続検証",
  () => {
    let billId: string;
    let usageIds: string[] = [];
    beforeEach(async () => {
      const existing = await adminClient
        .from("anjo_ai_usage")
        .select("id", { count: "exact", head: true });
      if (existing.error) throw existing.error;
      if (existing.count !== 0)
        throw new Error(
          "実利用のあるDBでは上限試験を実行しません。隔離した検証DBを使ってください。"
        );
      billId = (
        await createTestBill({
          name: "【初期接続検証用・終了後削除】",
          publish_status: "published",
        })
      ).id;
      const enabled = await adminClient
        .from("bills")
        .update({ use_knowledge_source_in_chat: true })
        .eq("id", billId);
      if (enabled.error) throw enabled.error;
    });
    afterEach(async () => {
      if (usageIds.length) {
        const result = await adminClient
          .from("anjo_ai_usage")
          .delete()
          .in("id", usageIds);
        if (result.error) throw result.error;
      }
      usageIds = [];
      if (billId) {
        const result = await adminClient
          .from("bills")
          .delete()
          .eq("id", billId);
        if (result.error) throw result.error;
      }
    });
    async function reserve(hash = "a".repeat(64), id = randomUUID()) {
      usageIds.push(id);
      const result = await adminClient.rpc("reserve_anjo_ai_request", {
        p_id: id,
        p_bill_id: billId,
        p_client_hash: hash,
      });
      if (result.error) throw result.error;
      return result.data;
    }
    async function addUsage(count: number, createdAt: string) {
      const rows = Array.from({ length: count }, () => ({
        id: randomUUID(),
        bill_id: billId,
        client_hash: "b".repeat(64),
        created_at: createdAt,
      }));
      usageIds.push(...rows.map((row) => row.id));
      const result = await adminClient.from("anjo_ai_usage").insert(rows);
      if (result.error) throw result.error;
    }
    it("匿名閲覧者は利用記録や予約RPCにアクセスできない", async () => {
      const anon = getAnonClient();
      expect(
        (await anon.from("anjo_ai_usage").select("id")).error
      ).not.toBeNull();
      expect(
        (
          await anon.rpc("reserve_anjo_ai_request", {
            p_id: randomUUID(),
            p_bill_id: billId,
            p_client_hash: "a".repeat(64),
          })
        ).error
      ).not.toBeNull();
    });
    it.each([
      "draft",
      "coming_soon",
    ] as const)("%s の資料は予約しない", async (publishStatus) => {
      const changed = await adminClient
        .from("bills")
        .update({ publish_status: publishStatus })
        .eq("id", billId);
      if (changed.error) throw changed.error;
      expect(await reserve()).toBe("unavailable");
    });
    it("議案ごとのAI停止を反映する", async () => {
      const changed = await adminClient
        .from("bills")
        .update({ use_knowledge_source_in_chat: false })
        .eq("id", billId);
      if (changed.error) throw changed.error;
      expect(await reserve()).toBe("unavailable");
    });
    it("同じIDの再予約と不正な識別値を拒否する", async () => {
      const id = randomUUID();
      expect(await reserve("a".repeat(64), id)).toBe("allowed");
      expect(await reserve("a".repeat(64), id)).toBe("duplicate");
      expect(await reserve("short")).toBe("invalid");
    });
    it("並列送信でも同じ利用者は1分に3回まで", async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, () => reserve())
      );
      expect(results.filter((value) => value === "allowed")).toHaveLength(3);
      expect(results.filter((value) => value === "rate_limit")).toHaveLength(2);
    });
    it("並列送信でも1日の全体上限を超えない", async () => {
      await addUsage(9, new Date().toISOString());
      const results = await Promise.all(
        Array.from({ length: 4 }, () => reserve())
      );
      expect(results.filter((value) => value === "allowed")).toHaveLength(1);
      expect(results.filter((value) => value === "daily_limit")).toHaveLength(
        3
      );
    });
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Tokyo",
    });
    it.skipIf(today.endsWith("-01"))(
      "過去の日の予約を含め、月1ドルの上限を守る",
      async () => {
        await addUsage(100, `${today.slice(0, 7)}-01T00:00:00+09:00`);
        expect(await reserve()).toBe("monthly_limit");
      }
    );
    it("議案削除後も予約額を残し、上限をリセットしない", async () => {
      expect(await reserve()).toBe("allowed");
      const removed = await adminClient.from("bills").delete().eq("id", billId);
      expect(removed.error).toBeNull();
      const saved = await adminClient
        .from("anjo_ai_usage")
        .select("bill_id,reserved_usd")
        .eq("id", usageIds[0])
        .single();
      expect(saved.data).toEqual({ bill_id: null, reserved_usd: 0.01 });
    });
  }
);
