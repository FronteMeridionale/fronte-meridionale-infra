import { NextRequest, NextResponse } from "next/server";
import { findByMemberCode, findByTelegramId } from "@/app/lib/member-repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const member_code = searchParams.get("member_code");
    const telegram_user_id = searchParams.get("telegram_user_id");

    if (!member_code && !telegram_user_id) {
      return NextResponse.json(
        { error: "È necessario fornire member_code o telegram_user_id" },
        { status: 400 }
      );
    }

    const member = member_code
      ? await findByMemberCode(member_code)
      : await findByTelegramId(telegram_user_id!);

    if (!member) {
      return NextResponse.json(
        { error: "Membro non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("[member/status] errore:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
