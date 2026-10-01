"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/features/auth/client/lib/auth-client";
export function PasswordForm() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function change(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = new FormData(form);
    const password = String(fields.get("password") || "");
    if (password.length < 12 || password !== fields.get("confirm")) {
      setMessage("12文字以上で、同じパスワードを2回入力してください。");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await authClient.updateUser({ password });
      setMessage(
        error
          ? "変更できませんでした。再ログインしてお試しください。"
          : "パスワードを変更しました。次回から新しいパスワードでログインしてください。"
      );
      if (!error) form.reset();
    } catch {
      setMessage("通信に失敗しました。時間を置いてお試しください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-lg border bg-white p-6 space-y-4">
      <h2 className="text-xl font-semibold">管理画面のパスワード</h2>
      <p>ご本人が入力・保存してください。チャットに送る必要はありません。</p>
      <form onSubmit={change} className="max-w-lg space-y-3">
        <Label htmlFor="owner-password">新しいパスワード（12文字以上）</Label>
        <Input
          id="owner-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          disabled={busy}
        />
        <Label htmlFor="owner-confirm">同じパスワードをもう一度</Label>
        <Input
          id="owner-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          disabled={busy}
        />
        <Button disabled={busy} type="submit">
          {busy ? "保存中…" : "新しいパスワードを保存"}
        </Button>
      </form>
      <p aria-live="polite">{message}</p>
    </section>
  );
}
