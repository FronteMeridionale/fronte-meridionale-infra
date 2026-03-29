import { NextRequest, NextResponse } from "next/server";
import { calculateMemberStatus } from "@/lib/member/status-engine";
import {
  findByTelegramId,
  generateMemberCode,
  saveMember,
} from "@/app/lib/member-repository";
import { Member } from "@/types/member";

export async function GET(request: NextRequest) {
  const telegram_user_id = request.nextUrl.searchParams.get("telegram_user_id");

  if (!telegram_user_id) {
    return NextResponse.json(
      { error: "telegram_user_id mancante" },
      { status: 400 }
    );
  }

  const existing = findByTelegramId(telegram_user_id);

  if (existing) {
    return NextResponse.json({
      message: "Membro già esistente",
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

  saveMember(newMember);

  return NextResponse.json({
    message: "Membro creato",
    member_code: newMember.member_code,
    status: newMember.status,
  });
}
