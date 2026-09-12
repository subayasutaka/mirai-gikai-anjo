import { defineConfig } from "vitest/config";
import base from "./vitest.config.mts";

// This fork exposes bill editing and source-grounded Q&A only.
// Legacy interview/topic publication suites require deliberately disabled privileges.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: [
      "db-function/reserve-anjo-ai-request.test.ts",
      "db-function/save-anjo-bill-contents.test.ts",
      "db-function/is-admin.test.ts",
      "db-function/handle-google-workspace-admin-role.test.ts",
      "db-function/set-active-diet-session.test.ts",
      "db-function/update-updated-at-column.test.ts",
      "db-function/anjo-disabled-publication.test.ts",
    ],
  },
});
