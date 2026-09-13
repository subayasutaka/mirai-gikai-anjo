import { describe, expect, it } from "vitest";
import { createTopicPrompt, EMPTY_TOPIC_CONTENT, topicContentSchema, topicEditSchema, topicKnowledge, topicStatusNote, isTopicPublic } from "./topics";

const content = {
  ...EMPTY_TOPIC_CONTENT, title: "財源の変更", formalTitle: "財源更正", summary: "支出は増減なし", description: "同じ額の一般財源を減らす。",
  target: "事業の財源", period: "2026年度", moneyLabel: "支出の増減", moneyValue: "0円", importantNote: "サービスを追加する意味ではない。",
  moneyDetails: "寄附金4.5万円、一般財源4.5万円減。", sourceNote: "予算説明書7ページ", knowledgeSource: "補正額0千円", checkedOn: "2026-09-13",
};
describe("暮らしの内容", () => {
  it("公開・会期一致を毎回確認し、親の変更や削除後に表示しない", () => {
    const topic={publish_status:"published",diet_session_id:"september"};
    const bill={publish_status:"published",diet_session_id:"september"};
    expect(isTopicPublic(topic,[bill,bill])).toBe(true);
    expect(isTopicPublic(topic,[bill,{...bill,publish_status:"draft"}])).toBe(false);
    expect(isTopicPublic(topic,[bill,{...bill,diet_session_id:"december"}])).toBe(false);
    expect(isTopicPublic(topic,[null])).toBe(false);
    expect(isTopicPublic(topic,[])).toBe(false);
    expect(isTopicPublic({...topic,publish_status:"draft"},[bill])).toBe(false);
  });
  it("異なる採決結果・空の備考・委員会日付をAIに伝える", () => {
    const base={name:"第1号",status:"enacted",status_note:null,introduction_date:"2026-08-27",plenary_question_date:"2026-09-03",committee_question_date:"2026-09-08",vote_date:"2026-09-15"};
    const status=topicStatusNote([base,{...base,name:"第2号",status:"rejected"}]);
    const prompt=createTopicPrompt({...content,committeeDates:[{name:"健康福祉",date:"2026-09-08",note:"日程確認"}]},"9月議会",status,"結果は？");
    expect(prompt).toContain("採決・原案可決");
    expect(prompt).toContain("採決・否決");
    expect(prompt).toContain("健康福祉：2026-09-08");
    expect(prompt).toContain("関連する各議案の登録状態を参照");
  });
  it("ゼロの支出増減と財源を異なる意味のままAIへ渡す", () => {
    expect(topicContentSchema.parse(content).moneyValue).toBe("0円");
    const prompt = createTopicPrompt(content, "2026年9月議会", "採決結果未確認", "支出は増える？");
    expect(prompt).toContain("支出の増減：0円");
    expect(prompt).toContain("一般財源4.5万円減");
    expect(prompt).toContain("2026年9月議会");
    expect(prompt).toContain("採決結果未確認");
  });
  it("未登録の質疑を明示し、長すぎる資料は切り捨てず拒否する", () => {
    expect(topicKnowledge(content, "会期")).toContain("質問・答弁の資料は未登録");
    expect(() => createTopicPrompt({...content, knowledgeSource: "あ".repeat(6000)}, "会期", "", "質問")).toThrow("source_too_long");
  });
  it("不正URL・日付・重複する議案・未入力を拒否する", () => {
    expect(topicContentSchema.safeParse({...content, sourceUrl: "javascript:alert(1)"}).success).toBe(false);
    expect(topicContentSchema.safeParse({...content, checkedOn: "2026-02-30"}).success).toBe(false);
    expect(topicContentSchema.safeParse(EMPTY_TOPIC_CONTENT).success).toBe(false);
    const id = "00000000-0000-4000-8000-000000000001";
    expect(topicEditSchema.safeParse({id, sessionId:id, content, billIds:[id,id], publishStatus:"draft", reviewed:false, sortOrder:0, expectedUpdatedAt:null}).success).toBe(false);
  });
});
