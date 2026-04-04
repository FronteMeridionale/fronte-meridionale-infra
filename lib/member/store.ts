import { createClient } from "@supabase/supabase-js";
import { Member } from "@/types/member";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function generateMemberCode(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FM-${Date.now()}-${random}`;
}

export async function findByTelegramId(
  telegram_user_id: string
): Promise<Member | undefined> {
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("telegram_user_id", telegram_user_id)
    .single();

  return data ?? undefined;
}

export async function findByMemberCode(
  member_code: string
): Promise<Member | undefined> {
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("member_code", member_code)
    .single();

  return data ?? undefined;
}

export async function saveMember(member: Member): Promise<Member> {
  await supabase.from("members").upsert(member);
  return member;
}
