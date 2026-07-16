import type { UserApiKeys } from "@/lib/user-keys";

// Best-effort notifications — a failed/misconfigured Telegram send should
// never break the actual feature (scene generation, marking a project
// complete). Errors are swallowed after a console.error, never thrown.
export async function sendTelegramMessage(
  text: string,
  keys: Pick<UserApiKeys, "telegramBotToken" | "telegramChatId">
): Promise<void> {
  const { telegramBotToken: token, telegramChatId: chatId } = keys;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      console.error("Telegram notification failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Telegram notification failed:", (err as Error).message);
  }
}
