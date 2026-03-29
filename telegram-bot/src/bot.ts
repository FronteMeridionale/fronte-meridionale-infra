import * as dotenv from "dotenv";
import { Bot, InlineKeyboard } from "grammy";

dotenv.config({ path: "../.env.local" });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
const WEB_APP_URL = `${BACKEND_URL}/mini-app`;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN non configurato");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

console.log("🤖 Bot Fronte Meridionale avviato...");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MemberResponse {
  member_code: string;
  status: string;
  total_eur_valid?: number;
}

async function getOrCreateMember(
  telegramUserId: string
): Promise<MemberResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/member/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_user_id: telegramUserId }),
    });
    if (!res.ok) return null;
    return (await res.json()) as MemberResponse;
  } catch (err) {
    console.error("[Create] fetch error:", err);
    return null;
  }
}

async function getMemberStatus(
  telegramUserId: string
): Promise<MemberResponse | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/member/status?telegram_user_id=${telegramUserId}`
    );
    if (!res.ok) return null;
    return (await res.json()) as MemberResponse;
  } catch (err) {
    console.error("[Status] fetch error:", err);
    return null;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "supporter":
      return "💙 Sostenitore";
    case "elector":
      return "🟢 Elettore";
    default:
      return "⚪ Partecipazione non ancora attiva";
  }
}

function miniAppKeyboard(): InlineKeyboard {
  return new InlineKeyboard().webApp("🌐 Apri Mini App", WEB_APP_URL);
}

// ---------------------------------------------------------------------------
// /start
// ---------------------------------------------------------------------------

bot.command("start", async (ctx) => {
  const userId = String(ctx.from?.id ?? ctx.chat.id);
  const firstName = ctx.from?.first_name ?? "Amico";

  console.log(`${userId} → /start`);

  const member = await getOrCreateMember(userId);
  if (!member) {
    await ctx.reply(
      "⚠️ Si è verificato un errore. Riprova tra qualche istante."
    );
    return;
  }

  await ctx.reply(
    `👋 Benvenuto, ${firstName}!\n\n` +
      `Il tuo codice membro è:\n` +
      `<code>${member.member_code}</code>\n\n` +
      `Stato attuale: ${statusLabel(member.status)}\n\n` +
      `Apri la Mini App per confermare la tua partecipazione.`,
    { parse_mode: "HTML", reply_markup: miniAppKeyboard() }
  );
});

// ---------------------------------------------------------------------------
// /status
// ---------------------------------------------------------------------------

bot.command("status", async (ctx) => {
  const userId = String(ctx.from?.id ?? ctx.chat.id);

  console.log(`${userId} → /status`);

  const member = await getMemberStatus(userId);
  if (!member) {
    await ctx.reply(
      "⚠️ Profilo non trovato. Invia /start per registrarti."
    );
    return;
  }

  const total = member.total_eur_valid ?? 0;
  await ctx.reply(
    `📊 <b>Il tuo stato</b>\n\n` +
      `Codice membro: <code>${member.member_code}</code>\n` +
      `Stato: ${statusLabel(member.status)}\n` +
      `Totale valido: ${total}€`,
    { parse_mode: "HTML" }
  );
});

// ---------------------------------------------------------------------------
// /app
// ---------------------------------------------------------------------------

bot.command("app", async (ctx) => {
  console.log(`${ctx.from?.id} → /app`);
  await ctx.reply("🌐 Apri la Mini App:", {
    reply_markup: miniAppKeyboard(),
  });
});

// ---------------------------------------------------------------------------
// /help
// ---------------------------------------------------------------------------

bot.command("help", async (ctx) => {
  console.log(`${ctx.from?.id} → /help`);
  await ctx.reply(
    `ℹ️ <b>Comandi disponibili</b>\n\n` +
      `/start — Registrazione e benvenuto\n` +
      `/status — Visualizza il tuo stato\n` +
      `/app — Apri la Mini App\n` +
      `/help — Mostra questo messaggio`,
    { parse_mode: "HTML" }
  );
});

// ---------------------------------------------------------------------------
// Fallback per testo non riconosciuto
// ---------------------------------------------------------------------------

bot.on("message", async (ctx) => {
  await ctx.reply(
    "Non riconosco questo comando. Invia /help per la lista dei comandi disponibili."
  );
});

// ---------------------------------------------------------------------------
// Start (long polling)
// ---------------------------------------------------------------------------

bot.start().catch((err) => {
  console.error("[Bot] Errore fatale:", err);
  process.exit(1);
});
