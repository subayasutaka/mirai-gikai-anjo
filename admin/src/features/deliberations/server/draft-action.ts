"use server";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { generateDeliberationDraft } from "./draft-service";
export async function draftDeliberation(billId: string, transcript: string) {
  try {
    const admin = await requireAdmin();
    z.uuid().parse(billId);
    return {
      draft: await generateDeliberationDraft(billId, transcript, admin.id),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "下書きを作成できませんでした。",
    };
  }
}
