import { NextRequest, NextResponse } from "next/server";
import { calculateMemberStatus } from "@/lib/member/status-engine";
import {
  findByTelegramId,
  generateMemberCode,
  saveMember,
} from "@/app/lib/member-repository";
import { Member } from "@/types/member";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegram_user_id } = body as { telegram_user_id?: unknown };

    if (!telegram_user_id || typeof telegram_user_id !== "string") {
      return NextResponse.json(
        { error: "telegram_user_id è obbligatorio" },
        { status: 400 }
      );
    }

    const existing = await findByTelegramId(telegram_user_id);

    if (existing) {
      return NextResponse.json({
        member_code: existing.member_code,
        status: existing.status,
      });
    }

    const newMember: Member = {
      member_code: generateMemberCode(telegram_user_id),
      telegram_user_id,
      wallet_address: null,
      total_eur_valid: 0,
      status: calculateMemberStatus(0),
      elector_since: null,
      can_vote_from: null,
      first_valid_tx_hash: null,
      last_tx_hash: null,
    };

    await saveMember(newMember);

    return NextResponse.json(
      { member_code: newMember.member_code, status: newMember.status },
      { status: 201 }
    );
  } catch (error) {
    console.error("[member/create] errore:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
