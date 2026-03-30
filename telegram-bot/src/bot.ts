import * as dotenv from "dotenv";
import { Bot, InlineKeyboard } from "grammy";

dotenv.config({ path: "../.env.local" });

// ---------------------------------------------------------------------------
// Configurazione ambiente
// ---------------------------------------------------------------------------

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, "");

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN non configurato");
  process.exit(1);
}

if (!BACKEND_URL) {
  console.error("❌ BACKEND_URL non configurato");
  process.exit(1);
}

const WEB_APP_URL = `${BACKEND_URL}/mini-app`;

console.log("🤖 Bot Fronte Meridionale avviato");
console.log("🌐 Backend:", BACKEND_URL);
console.log("📱 MiniApp:", WEB_APP_URL);

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

const bot = new Bot(BOT_TOKEN);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberResponse {
  member_code: string;
  status: string;
  total_eur_valid?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrCreateMember(
  telegramUserId: string
): Promise<MemberResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/member/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telegram_user_id: telegramUserId,
      }),
    });

    if (!res.ok) {
      console.error(`[Create] HTTP ${res.status}`);
      return null;
    }

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

    if (!res.ok) {
      console.error(`[Status] HTTP ${res.status}`);
      return null;
    }

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

// ---------------------------------------------------------------------------
// Keyboard Mini App
// ---------------------------------------------------------------------------

function miniAppKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.webApp("🌐 Apri la Mini App", WEB_APP_URL);
  return keyboard;
}

function miniAppUrlKeyboard(): InlineKeyboard {
  return new InlineKeyboard().url("🔗 Apri Mini App nel browser", WEB_APP_URL);
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
      "⚠️ Si è verificato un errore durante la registrazione. Riprova tra qualche istante."
    );
    return;
  }

  await ctx.reply(
    `👋 Benvenuto, ${firstName}!\n\n` +
      `Il tuo codice membro è:\n` +
      `<code>${member.member_code}</code>\n\n` +
      `Stato attuale: ${statusLabel(member.status)}\n\n` +
      `Per continuare, apri la Mini App dal pulsante qui sotto.`,
    {
      parse_mode: "HTML",
      reply_markup: miniAppKeyboard(),
    }
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
    await ctx.reply("⚠️ Profilo non trovato. Invia /start per registrarti.");
    return;
  }

  const total = member.total_eur_valid ?? 0;

  await ctx.reply(
    `📊 <b>Il tuo stato</b>\n\n` +
      `Codice membro: <code>${member.member_code}</code>\n` +
      `Stato: ${statusLabel(member.status)}\n` +
      `Totale valido: ${total}€`,
    {
      parse_mode: "HTML",
    }
  );
});

// ---------------------------------------------------------------------------
// /app
// ---------------------------------------------------------------------------

bot.command("app", async (ctx) => {
  console.log(`${ctx.from?.id} → /app`);

  await ctx.reply("Apri la Mini App del Fronte Meridionale:", {
    reply_markup: miniAppKeyboard(),
  });
});

// ---------------------------------------------------------------------------
// /miniapp fallback
// ---------------------------------------------------------------------------

bot.command("miniapp", async (ctx) => {
  console.log(`${ctx.from?.id} → /miniapp`);

  await ctx.reply(
    "Se il pulsante della Mini App non si apre correttamente dentro Telegram, usa questo collegamento diretto:",
    {
      reply_markup: miniAppUrlKeyboard(),
    }
  );
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
      `/miniapp — Apri il collegamento diretto\n` +
      `/help — Mostra questo messaggio`,
    {
      parse_mode: "HTML",
    }
  );
});

// ---------------------------------------------------------------------------
// Messaggi non riconosciuti
// ---------------------------------------------------------------------------

bot.on("message:text", async (ctx) => {
  await ctx.reply(
    "Non riconosco questo comando.\n\nInvia /help per vedere i comandi disponibili."
  );
});

// ---------------------------------------------------------------------------
// Avvio bot
// ---------------------------------------------------------------------------

bot.start().catch((err) => {
  console.error("❌ Errore fatale bot:", err);
  process.exit(1);
});
