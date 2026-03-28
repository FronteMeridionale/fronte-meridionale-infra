import { NextRequest, NextResponse } from "next/server";
import { calculateMemberStatus } from "@/lib/member/status-engine";
import {
  findByTelegramId,
  generateMemberCode,
  saveMember,
} from "@/lib/member/store";
import { Member } from "@/types/member";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegram_user_id } = body;

    if (!telegram_user_id || typeof telegram_user_id !== "string") {
      return NextResponse.json(
        { error: "telegram_user_id è obbligatorio" },
        { status: 400 }
      );
    }

    const existing = findByTelegramId(telegram_user_id);
    if (existing) {
      return NextResponse.json({
        member_code: existing.member_code,
        status: existing.status,
      });
    }

    const newMember: Member = {
      member_code: generateMemberCode(),
      telegram_user_id,
      wallet_address: null,
      total_eur_valid: 0,
      status: calculateMemberStatus(0),
      elector_since: null,
      first_valid_tx_hash: null,
      last_tx_hash: null,
    };

    saveMember(newMember);

    return NextResponse.json(
      { member_code: newMember.member_code, status: newMember.status },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
