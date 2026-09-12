// Client text and its server-generated ruby use one registry; add future labels here.
export const CHAT_COPY = {
  title: "AIに聞いてみよう",
  scope: "いま質問できる議案",
  disclaimer:
    "この議案の登録資料だけを参照します。資料にないことは分からないと答えます。氏名や連絡先などの個人情報は入力しないでください。",
  unavailable: "AIは接続準備中です。現在、質問は送信されません。",
  changeQuestion: "どんなことが変わりますか？",
  dateQuestion: "いつから変わりますか？",
  statusQuestion: "もう決まったことですか？",
  inputLabel: "質問（500文字以内）",
  busy: "資料を確認しています…",
  submit: "AIに質問する",
  answerTitle: "AIの回答",
  answerNote:
    "AIは誤ることがあります。議案ページの「公式の議案書」で確認してください。",
  failed: "回答を取得できませんでした。",
  communicationFailed: "通信に失敗しました。",
} as const;
