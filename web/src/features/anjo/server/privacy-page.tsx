import "server-only";
import { Furigana } from "./furigana";
export function AnjoInfoPage() {
  return (
    <article className="anjo-markdown">
      <h1>
        <Furigana>{"データの取り扱い"}</Furigana>
      </h1>
      <p>
        <Furigana>
          {
            "運営者はすば康貴です。初期実証ではアクセス解析・市民意見収集を行いません。"
          }
        </Furigana>
      </p>
      <h2>
        <Furigana>{"AIへの質問"}</Furigana>
      </h2>
      <p>
        <Furigana>
          {
            "質問と参照資料は回答生成のためVercel AI GatewayとAlibabaのQwenモデルへ送られます。個人情報や非公開の情報は入力しないでください。運営用DBには質問本文を保存せず、日時・モデル・トークン数・推計費用・成功／失敗・連続送信を制限する日替わり識別番号を記録します。サービス提供会社の運用ログについては各社の規約が適用されます。"
          }
        </Furigana>
      </p>
      <h2>
        <Furigana>{"読みやすさの設定"}</Furigana>
      </h2>
      <p>
        <Furigana>
          {
            "ふりがなの表示設定は、お使いのブラウザ内に保存します。ふりがなはこのサービス内の日本語辞書で付けるため、ふりがな専用の外部サービスへ本文を送りません。自動で付けた読みが誤っていることがあります。"
          }
        </Furigana>
      </p>
      <h2>
        <Furigana>{"管理画面"}</Furigana>
      </h2>
      <p>
        <Furigana>
          {
            "運営者のログイン状態を保つCookieを使用します。プレビューリンクは下書きを閲覧できるため、確認者以外に共有しないでください。"
          }
        </Furigana>
      </p>
    </article>
  );
}
