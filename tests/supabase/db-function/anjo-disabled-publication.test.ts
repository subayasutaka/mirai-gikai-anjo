import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { adminClient, getAnonClient } from "../utils";

describe("安城実証では市民意見の自動公開を無効にする", () => {
  it("サーバーから一括公開を呼んでも0件のまま", async () => {
    const result = await adminClient.rpc("bulk_publish_reports", {
      p_config_id: randomUUID(),
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    });
    expect(result.error).toBeNull();
    expect(result.data).toBe(0);
  });
  it("トピック分析の公開要求を拒否する", async () => {
    const result = await adminClient.rpc("publish_topic_analysis_version", {
      p_version_id: randomUUID(),
    });
    expect(result.error?.message).toContain(
      "Topic publication is disabled in the Anjo pilot"
    );
  });
  it("匿名閲覧者は一括公開RPCを呼べない", async () => {
    const result = await getAnonClient().rpc("bulk_publish_reports", {
      p_config_id: randomUUID(),
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    });
    expect(result.error).not.toBeNull();
  });
});
