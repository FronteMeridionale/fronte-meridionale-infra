import { createHmac, timingSafeEqual } from "crypto";

/**
 * Validates Telegram WebApp initData using HMAC-SHA256.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(hash, "hex"));
}

/**
 * Parses the `user` field from Telegram initData.
 */
export function parseInitDataUser(
  initData: string
): { id: number; username?: string; first_name?: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get("user");
    if (!userParam) return null;
    return JSON.parse(userParam) as {
      id: number;
      username?: string;
      first_name?: string;
    };
  } catch {
    return null;
  }
}
