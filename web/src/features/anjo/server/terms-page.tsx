import "server-only";
import { Furigana } from "./furigana";
export function AnjoInfoPage() {
  return (
    <article className="anjo-markdown">
      <h1>
        <Furigana>{"利用について"}</Furigana>
      </h1>
      <p>
        <Furigana>
          {
            "このサービスは、すば康貴個人が制作・運営する非公式実証です。安城市・安城市議会・政党チームみらいの公式サービスではありません。"
          }
        </Furigana>
      </p>
      <p>
        <Furigana>
          {
            "議案の説明とAIの回答は、原資料の理解を助けるためのものです。正式な内容・審議結果はリンク先の公式資料で確認してください。説明文の確認状況を各ページに表示します。"
          }
        </Furigana>
      </p>
      <p>
        <Furigana>
          {
            "AIが答えられる範囲は登録資料に限ります。医療・法律など個別の専門判断や、未登録の政治的な見解を回答する用途には使いません。"
          }
        </Furigana>
      </p>
      <p>
        <Furigana>
          {
            "無料枠で運営する実証のため、利用制限や一時停止が生じる場合があります。"
          }
        </Furigana>
      </p>
    </article>
  );
}
