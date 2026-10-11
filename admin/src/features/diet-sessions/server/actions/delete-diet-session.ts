"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { DeleteDietSessionInput } from "../../shared/types";
import { deleteDietSessionRecord } from "../repositories/diet-session-repository";

export async function deleteDietSession(input: DeleteDietSessionInput) {
  try {
    await requireAdmin();

    await deleteDietSessionRecord(input.id);

    revalidatePath(routes.dietSessions());
    await invalidateWebCache([WEB_CACHE_TAGS.DIET_SESSIONS]);
    return { success: true };
  } catch (error) {
    console.error("Delete diet session error:", error);
    return {
      error: getErrorMessage(error, "会期の削除中にエラーが発生しました"),
    };
  }
}
