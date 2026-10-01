import "server-only";
import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export async function transcribeLocalAudio(audio: File, signal?: AbortSignal) {
  const model = process.env.ANJO_WHISPER_MODEL;
  if (process.env.VERCEL || !model)
    throw new Error("録音の文字起こしは、このMacの管理画面で利用できます。");
  if (!audio.size || audio.size > 250 * 1024 * 1024)
    throw new Error("録音は250MB以内にしてください。");
  await access(model);
  const folder = await mkdtemp(join(tmpdir(), "anjo-audio-"));
  try {
    const input = join(folder, "input");
    const wav = join(folder, "audio.wav");
    await writeFile(input, Buffer.from(await audio.arrayBuffer()), {
      mode: 0o600,
    });
    const { stdout } = await run(
      "/opt/homebrew/bin/ffprobe",
      [
        "-protocol_whitelist",
        "file,pipe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        input,
      ],
      { timeout: 30000, signal }
    );
    const seconds = Number(stdout.trim());
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 7200)
      throw new Error("録音は2時間以内に分けてください。");
    await run(
      "/opt/homebrew/bin/ffmpeg",
      [
        "-nostdin",
        "-y",
        "-protocol_whitelist",
        "file,pipe",
        "-i",
        input,
        "-vn",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        wav,
      ],
      { timeout: 300000, signal }
    );
    const output = join(folder, "transcript");
    await run(
      "/opt/homebrew/bin/whisper-cli",
      ["-m", model, "-f", wav, "-l", "ja", "-oj", "-of", output, "-np"],
      { timeout: 3600000, maxBuffer: 4 * 1024 * 1024, signal }
    );
    const result = JSON.parse(await readFile(output + ".json", "utf8"));
    const segments = result.transcription as Array<{
      timestamps: { from: string; to: string };
      text: string;
    }>;
    if (!Array.isArray(segments))
      throw new Error("文字起こし結果を読み取れませんでした。");
    return {
      seconds,
      text: segments
        .map(
          (s) => `[${s.timestamps.from} → ${s.timestamps.to}] ${s.text.trim()}`
        )
        .join("\n"),
    };
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}
