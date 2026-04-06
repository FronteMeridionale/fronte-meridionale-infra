import { NextRequest, NextResponse } from "next/server";
import {
  validateTelegramInitData,
  parseInitDataUser,
} from "@/app/lib/telegram-validation";
import { checkRateLimit } from "@/app/lib/rate-limiter";
import { findByTelegramId, saveMember } from "@/app/lib/member-repository";
import {
  createMemberTransaction,
  findTransactionByHash,
  sumValidTransactionsEurByTelegramUserIdAndYear,
} from "@/app/lib/member-transactions-repository";
import {
  fetchUsdtTransfersToWallet,
  rawAmountToUsdt,
  USDT_SYMBOL,
} from "@/app/lib/ton-api";
import { calculateMemberStatus } from "@/lib/member/status-engine";

const TREASURY_WALLET =
  process.env.TREASURY_WALLET ??
  "UQBbSnuUUKB4gKwKAdFJd8JglUoY40dfLCWFr4kr0geOGKm5";

const MIN_USDT = 15;

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
      console.error("[verify-transaction] TELEGRAM_BOT_TOKEN non configurato");
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

    if (!checkRateLimit(`verify-transaction:${telegram_user_id}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Troppe richieste, riprova tra poco" },
        { status: 429 }
      );
    }

    const member = await findByTelegramId(telegram_user_id);
    if (!member) {
      return NextResponse.json(
        { error: "Membro non trovato. Avvia prima il bot." },
        { status: 404 }
      );
    }

    const { member_code } = member;

    console.log(
      `[verify-transaction] Checking transactions for member ${member_code} (user ${telegram_user_id})`
    );

    // Query TON blockchain for USDT transfers to the treasury wallet
    const transfers = await fetchUsdtTransfersToWallet(TREASURY_WALLET);

    console.log(
      `[verify-transaction] Found ${transfers.length} total USDT transfers to treasury`
    );

    // Filter: comment = member_code AND amount >= MIN_USDT
    const matching = transfers.filter((t) => {
      const usdtAmount = rawAmountToUsdt(t.amount);
      const commentMatch = t.comment?.trim() === member_code;
      const amountOk = usdtAmount >= MIN_USDT;

      if (commentMatch) {
        console.log(
          `[verify-transaction] Candidate tx ${t.tx_hash}: amount=${usdtAmount} USDT, comment="${t.comment}", amountOk=${amountOk}`
        );
      }

      return commentMatch && amountOk;
    });

    if (matching.length === 0) {
      console.log(
        `[verify-transaction] No valid transaction found for member ${member_code}`
      );
      return NextResponse.json(
        {
          status: "pending",
          message:
            "Transazione non trovata. Assicurati di aver inviato almeno 15 USDT con il tuo codice membro nel campo memo.",
        },
        { status: 200 }
      );
    }

    const currentYear = new Date().getFullYear();
    let newTransactionSaved = false;

    for (const tx of matching) {
      // Avoid double-registration of the same tx_hash
      const existing = await findTransactionByHash(tx.tx_hash);
      if (existing) {
        console.log(
          `[verify-transaction] tx ${tx.tx_hash} already registered, skipping`
        );
        continue;
      }

      const usdtAmount = rawAmountToUsdt(tx.amount);
      const txDate = new Date(tx.tx_timestamp * 1000);
      const txYear = txDate.getFullYear();

      await createMemberTransaction({
        telegram_user_id,
        member_code,
        declared_role: null,
        tx_hash: tx.tx_hash,
        blockchain: "ton",
        asset: USDT_SYMBOL,
        amount_asset: usdtAmount,
        amount_eur: usdtAmount, // USDT is treated as 1:1 with EUR (both are USD-pegged stablecoins ≈ $1); adjust if EUR/USD conversion is required in the future
        wallet_address_from: tx.sender,
        wallet_address_to: tx.recipient,
        treasury_wallet_address: TREASURY_WALLET,
        tx_comment: tx.comment,
        tx_timestamp: txDate.toISOString(),
        calendar_year: txYear,
        is_valid: true,
        validation_reason: "Verified on-chain: correct recipient, asset, memo, and amount",
        validated_at: new Date().toISOString(),
      });

      console.log(
        `[verify-transaction] Saved new transaction ${tx.tx_hash} for member ${member_code} (${usdtAmount} USDT, year ${txYear})`
      );
      newTransactionSaved = true;
    }

    // Recalculate total valid for current year and update member status
    const totalEur = await sumValidTransactionsEurByTelegramUserIdAndYear(
      telegram_user_id,
      currentYear
    );

    const newStatus = calculateMemberStatus(totalEur);

    const updatedMember = {
      ...member,
      status: newStatus,
      total_eur_valid: totalEur,
      elector_since:
        newStatus === "elector" && member.status !== "elector"
          ? new Date().toISOString()
          : member.elector_since,
    };

    await saveMember(updatedMember);

    console.log(
      `[verify-transaction] Member ${member_code} updated: status=${newStatus}, total_eur_valid=${totalEur}, newTxSaved=${newTransactionSaved}`
    );

    if (newStatus === "none") {
      return NextResponse.json(
        {
          status: "pending",
          message:
            "Transazione non ancora sufficiente per ottenere lo status di sostenitore.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: newStatus,
        total_valid: totalEur,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[verify-transaction] errore:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
