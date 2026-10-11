import { type NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { transcribeLocalAudio } from "@/features/deliberations/server/transcribe-audio";
export const runtime = "nodejs";
let busy = false;
export async function POST(request: NextRequest) {
  if (process.env.VERCEL)
    return NextResponse.json(
      { error: "録音はこのMacの管理画面から読み込んでください。" },
      { status: 404 }
    );
  if (!(await getCurrentAdmin()))
    return NextResponse.json(
      { error: "管理者ログインが必要です。" },
      { status: 401 }
    );
  if (
    request.headers.get("origin") !== request.nextUrl.origin ||
    !["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)
  )
    return NextResponse.json(
      { error: "このMacの管理画面から操作してください。" },
      { status: 403 }
    );
  if (busy)
    return NextResponse.json(
      { error: "別の文字起こしが実行中です。" },
      { status: 429 }
    );
  if (Number(request.headers.get("content-length")) > 251 * 1024 * 1024)
    return NextResponse.json(
      { error: "録音は250MB以内にしてください。" },
      { status: 413 }
    );
  busy = true;
  try {
    const data = await request.formData();
    const audio = data.get("audio");
    if (!(audio instanceof File))
      return NextResponse.json(
        { error: "録音ファイルを選んでください。" },
        { status: 400 }
      );
    return NextResponse.json(
      await transcribeLocalAudio(audio, request.signal),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "文字起こしできませんでした。録音の形式・250MB／2時間以内の条件・Macの設定を確認してください。",
      },
      { status: 422 }
    );
  } finally {
    busy = false;
  }
}
