import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanupTestUser,
  createTestAdminUser,
  createTestUser,
  getAnonClient,
  getAuthenticatedClient,
  type TestUser,
} from "../utils";

describe("is_admin() 関数", () => {
  let adminUser: TestUser;
  let normalUser: TestUser;

  beforeEach(async () => {
    adminUser = await createTestAdminUser();
    normalUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestUser(adminUser.id);
    await cleanupTestUser(normalUser.id);
  });

  it("admin ユーザーで認証すると true を返す", async () => {
    const client = await getAuthenticatedClient(
      adminUser.email,
      adminUser.password
    );
    const { data, error } = await client.rpc("is_admin");
    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("一般ユーザーで認証すると false を返す", async () => {
    const client = await getAuthenticatedClient(
      normalUser.email,
      normalUser.password
    );
    const { data, error } = await client.rpc("is_admin");
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("anon クライアントからは実行できない", async () => {
    const client = getAnonClient();
    const { data, error } = await client.rpc("is_admin");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("メールでログインできても一般の新規登録は許可しない", async () => {
    const client = getAnonClient();
    const { data, error } = await client.auth.signUp({
      email: `blocked-signup-${crypto.randomUUID()}@example.com`,
      password: "test-password-123",
    });
    // 設定が退行した場合も、このテスト自身が作ったユーザーだけを片付ける。
    if (data.user) await cleanupTestUser(data.user.id);
    expect(error?.code).toBe("signup_disabled");
    expect(data.user).toBeNull();
    expect(data.session).toBeNull();
  });
});
