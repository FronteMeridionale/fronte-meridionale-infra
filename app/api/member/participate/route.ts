import { NextRequest, NextResponse } from "next/server";
import {
  validateTelegramInitData,
  parseInitDataUser,
} from "@/app/lib/telegram-validation";
import { checkRateLimit } from "@/app/lib/rate-limiter";
import { findByTelegramId } from "@/app/lib/member-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body as { initData?: unknown };

    if (!initData || typeof initData !== "string") {
      return NextResponse.json(
        { error: "initData è obbligatorio" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("[Participate] TELEGRAM_BOT_TOKEN non configurato");
      return NextResponse.json(
        { error: "Configurazione server non valida" },
        { status: 500 }
      );
    }

    if (!validateTelegramInitData(initData, botToken)) {
      return NextResponse.json(
        { error: "Accesso non autorizzato" },
        { status: 401 }
      );
    }

    const user = parseInitDataUser(initData);
    if (!user) {
      return NextResponse.json(
        { error: "Dati utente non validi" },
        { status: 400 }
      );
    }

    const telegram_user_id = String(user.id);

    if (!checkRateLimit(`participate:${telegram_user_id}`)) {
      return NextResponse.json(
        { error: "Troppe richieste, riprova tra poco" },
        { status: 429 }
      );
    }

    const member = findByTelegramId(telegram_user_id);
    if (!member) {
      return NextResponse.json(
        { error: "Membro non trovato. Avvia prima il bot." },
        { status: 404 }
      );
    }

    console.log(
      `[Participate] User ${telegram_user_id}: richiesta ricevuta, nessun accredito automatico eseguito`
    );

    return NextResponse.json(
      {
        ...member,
        info: "La partecipazione reale richiede una transazione verificata verso la tesoreria. Nessun accredito automatico è stato eseguito.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Participate] errore:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
