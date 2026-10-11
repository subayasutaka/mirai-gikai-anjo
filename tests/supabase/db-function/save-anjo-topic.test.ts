import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  createTestBill,
  createTestDietSession,
  getAnonClient,
} from "../utils";

describe("暮らしの内容と正式議案の同時保存", () => {
  const topicId = randomUUID();
  let sessionId: string;
  let billId: string;
  let otherBillId: string;
  let version: string;
  beforeAll(async () => {
    sessionId = (await createTestDietSession()).id;
    billId = (
      await createTestBill({
        name: "【検証専用・非公開】予算の内容",
        publish_status: "draft",
        diet_session_id: sessionId,
      })
    ).id;
    otherBillId = (
      await createTestBill({
        name: "【検証専用・非公開】関連の入替",
        publish_status: "draft",
        diet_session_id: sessionId,
      })
    ).id;
  });
  afterAll(async () => {
    const result = await adminClient
      .from("anjo_topics")
      .delete()
      .eq("id", topicId);
    if (result.error) throw result.error;
    if (billId) await adminClient.from("bills").delete().eq("id", billId);
    if (otherBillId)
      await adminClient.from("bills").delete().eq("id", otherBillId);
    if (sessionId)
      await adminClient.from("diet_sessions").delete().eq("id", sessionId);
  });
  function args() {
    return {
      p_id: topicId,
      p_session_id: sessionId,
      p_content: { version: 1, title: "検証" },
      p_bill_ids: [billId],
      p_publish_status: "draft",
      p_reviewed: false,
      p_sort_order: 0,
    };
  }
  it("匿名で保存・読み取りできず、下書き議案を含む内容は公開できない", async () => {
    expect(
      (await getAnonClient().rpc("save_anjo_topic", args())).error
    ).not.toBeNull();
    expect(
      (await getAnonClient().from("anjo_topics").select("id")).data ?? []
    ).toHaveLength(0);
    expect(
      (
        await adminClient.rpc("save_anjo_topic", {
          ...args(),
          p_publish_status: "published",
        })
      ).error?.message
    ).toContain("invalid_bill_links");
    expect(
      (await adminClient.from("anjo_topics").select("id").eq("id", topicId))
        .data
    ).toHaveLength(0);
  });
  it("下書きと関連を保存し、別会期・重複・消えた議案の参照を拒否する", async () => {
    expect((await adminClient.rpc("save_anjo_topic", args())).error).toBeNull();
    const saved = await adminClient
      .from("anjo_topics")
      .select("updated_at,anjo_topic_bills(bill_id)")
      .eq("id", topicId)
      .single();
    if (!saved.data) throw new Error("save failed");
    version = saved.data.updated_at;
    expect(saved.data.anjo_topic_bills).toEqual([{ bill_id: billId }]);
    for (const invalid of [
      { p_session_id: randomUUID() },
      { p_bill_ids: [billId, billId] },
      { p_bill_ids: [randomUUID()] },
    ]) {
      expect(
        (
          await adminClient.rpc("save_anjo_topic", {
            ...args(),
            p_expected_updated_at: version,
            ...invalid,
          })
        ).error?.message
      ).toContain("invalid_bill_links");
    }
    expect(
      (
        await adminClient
          .from("anjo_topics")
          .select("updated_at")
          .eq("id", topicId)
          .single()
      ).data?.updated_at
    ).toBe(version);
  });
  it("更新後の古い画面からの上書きは拒否し、確認済み状態も明示的に保存する", async () => {
    expect(
      (
        await adminClient.rpc("save_anjo_topic", {
          ...args(),
          p_expected_updated_at: version,
          p_reviewed: true,
        })
      ).error
    ).toBeNull();
    expect(
      (
        await adminClient.rpc("save_anjo_topic", {
          ...args(),
          p_expected_updated_at: version,
        })
      ).error?.message
    ).toContain("stale_topic");
    expect(
      (
        await adminClient
          .from("anjo_topics")
          .select("is_review_completed")
          .eq("id", topicId)
          .single()
      ).data?.is_review_completed
    ).toBe(true);
  });
  it("複数議案の追加・削除を内容と同時に保存する", async () => {
    const current = await adminClient
      .from("anjo_topics")
      .select("updated_at")
      .eq("id", topicId)
      .single();
    expect(
      (
        await adminClient.rpc("save_anjo_topic", {
          ...args(),
          p_expected_updated_at: current.data?.updated_at,
          p_bill_ids: [billId, otherBillId],
        })
      ).error
    ).toBeNull();
    const two = await adminClient
      .from("anjo_topics")
      .select("updated_at,anjo_topic_bills(bill_id)")
      .eq("id", topicId)
      .single();
    expect(
      two.data?.anjo_topic_bills.map((link) => link.bill_id).sort()
    ).toEqual([billId, otherBillId].sort());
    expect(
      (
        await adminClient.rpc("save_anjo_topic", {
          ...args(),
          p_expected_updated_at: two.data?.updated_at,
          p_bill_ids: [otherBillId],
        })
      ).error
    ).toBeNull();
    const one = await adminClient
      .from("anjo_topic_bills")
      .select("bill_id")
      .eq("topic_id", topicId);
    expect(one.data).toEqual([{ bill_id: otherBillId }]);
  });
});
