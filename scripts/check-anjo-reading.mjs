// Run against an already running site: node scripts/check-anjo-reading.mjs <url>
// Uses the browser only; it does not save data or submit AI questions.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const base = new URL(process.argv[2] || "http://127.0.0.1:3000");
const session = `anjo-reading-check-${process.pid}`;
const agent = (...args) => {
  const response = JSON.parse(
    execFileSync(
      "npx",
      [
        "--yes",
        "agent-browser@0.38.1",
        "--session",
        session,
        "--json",
        ...args,
      ],
      { encoding: "utf8", timeout: 60000 }
    )
  );
  assert.ok(response.success, JSON.stringify(response.error));
  return response.data;
};
const evaluate = (expression) => agent("eval", expression).result;
const detailSwitch = '[role="switch"][aria-label="くわしい説明に切り替え"]';
const rubySwitch = '[role="switch"][aria-label="ふりがなを表示"]';
const open = (path) => {
  agent("open", new URL(path, base).href);
  agent("wait", "--load", "networkidle");
  assert.equal(
    evaluate('!!document.querySelector("[data-nextjs-dialog]")'),
    false
  );
};
const toggle = () => agent("click", detailSwitch);
const visibleText = (selector) =>
  evaluate(
    `Array.from(document.querySelectorAll(${JSON.stringify(selector)})).filter(el => el.getClientRects().length > 0).map(el => el.innerText)`
  );
const normal = () => {
  if (
    evaluate('document.querySelector(".anjo-site").dataset.detailed') === "true"
  )
    toggle();
};
const changesAndRestores = (selector) => {
  normal();
  const before = visibleText(selector);
  assert.equal(
    before.length,
    1,
    `${selector}: only one explanation should be visible`
  );
  toggle();
  assert.equal(visibleText(selector).length, 1);
  assert.notDeepEqual(
    visibleText(selector),
    before,
    `${selector}: detailed text must change`
  );
  toggle();
  assert.deepEqual(
    visibleText(selector),
    before,
    `${selector}: easy text must return`
  );
};

try {
  for (const width of [1280, 390]) {
    agent("set", "viewport", String(width), "844");
    open("/");
    normal();
    const topicSelector = '.anjo-topic-card[href^="/contents/"]';
    const cards = () =>
      evaluate(
        `Array.from(document.querySelectorAll('${topicSelector}'), el => ({href:el.getAttribute('href'),text:el.innerText,title:el.querySelector('h3').innerText,explanation:Array.from(el.querySelectorAll('p[data-reading-level]')).filter(p=>p.getClientRects().length>0).map(p=>p.innerText).join('')}))`
      );
    const easyCards = cards();
    assert.ok(
      easyCards.length > 0,
      "published budget content is needed for this check"
    );
    toggle();
    const hardCards = cards();
    assert.equal(hardCards.length, easyCards.length);
    easyCards.forEach((card, index) => {
      assert.equal(hardCards[index].href, card.href);
      assert.notEqual(
        hardCards[index].explanation,
        card.explanation,
        `${card.href}: card explanation must change`
      );
      assert.notEqual(
        hardCards[index].title,
        card.title,
        `${card.href}: card title must change`
      );
    });
    toggle();
    assert.deepEqual(cards(), easyCards);
    changesAndRestores("#contents-title");

    const mapCard = easyCards.find((card) => card.text.includes("公図"));
    assert.ok(mapCard, "published content about 公図 is needed for this check");
    open(mapCard.href);
    changesAndRestores(".anjo-detail-heading .anjo-lead");
    changesAndRestores(".anjo-detail-heading h1");
    if (
      evaluate(
        `document.querySelector('${rubySwitch}').getAttribute('aria-checked')`
      ) !== "true"
    )
      agent("click", rubySwitch);
    const readings = evaluate(
      `Array.from(document.querySelectorAll('ruby')).filter(el => el.firstChild?.textContent === '公図').map(el => el.querySelector('rt')?.textContent)`
    );
    assert.ok(readings.length > 0, "fixture must contain 公図");
    assert.ok(readings.every((reading) => reading === "こうず"));
    const billLink = evaluate(
      'document.querySelector(".anjo-bill-reference").getAttribute("href")'
    );

    open(billLink);
    changesAndRestores(".anjo-bill-topics");
    changesAndRestores(".anjo-article .anjo-markdown");
    // The introductory budget summary is separate from the full explanation.
    changesAndRestores("article > .anjo-panel.anjo-lead");
    agent("fill", "textarea", "書きかけの質問");
    toggle();
    assert.equal(
      evaluate('document.querySelector("textarea").value'),
      "書きかけの質問"
    );
    open("/?view=bills");
    normal();
    const billCards = () =>
      evaluate(
        `Array.from(document.querySelectorAll('[data-bill-group] a[href^="/bills/"]'),el=>({href:el.getAttribute('href'),title:Array.from(el.querySelectorAll('h3')).filter(h=>h.getClientRects().length>0).map(h=>h.innerText).join('')}))`
      );
    const easyBills = billCards();
    assert.equal(
      new Set(easyBills.map((b) => b.href)).size,
      easyBills.length,
      "no bill is duplicated across groups"
    );
    assert.ok(
      evaluate(
        `document.querySelectorAll('[data-bill-group="supplementary"] a[href^="/bills/"]').length`
      ) > 0,
      "supplementary budget bills remain visible"
    );
    assert.ok(
      easyBills.every((b) => !/(否決|可決|に同意)/.test(b.title)),
      "results do not belong in titles"
    );
    toggle();
    const hardBills = billCards();
    assert.deepEqual(
      hardBills.map((b) => b.href),
      easyBills.map((b) => b.href)
    );
    assert.ok(hardBills.every((b) => !/(否決|可決|に同意)/.test(b.title)));
    assert.ok(visibleText("#group-supplementary")[0].includes("補正"));
    toggle();
    assert.deepEqual(billCards(), easyBills);
    console.log(
      `PASS ${width}px: cards, content, budget introduction, full explanation, 公図 ruby, draft question`
    );
  }
} finally {
  agent("close");
}
