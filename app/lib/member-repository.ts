import { createClient } from "@supabase/supabase-js";
import { Member, MemberStatus } from "@/types/member";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL non configurato");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY non configurato");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type MemberRow = {
  telegram_user_id: string;
  member_code: string;
  status: string;
  total_eur_valid: number;
  elector_since: string | null;
  can_vote_from: string | null;
  wallet_address: string | null;
  first_valid_tx_hash: string | null;
  last_tx_hash: string | null;
};

function rowToMember(row: MemberRow): Member {
  return {
    telegram_user_id: row.telegram_user_id,
    member_code: row.member_code,
    status: row.status as MemberStatus,
    total_eur_valid: Number(row.total_eur_valid),
    elector_since: row.elector_since,
    can_vote_from: row.can_vote_from,
    wallet_address: row.wallet_address,
    first_valid_tx_hash: row.first_valid_tx_hash,
    last_tx_hash: row.last_tx_hash,
  };
}

/**
 * Generates a deterministic member code from a Telegram user ID.
 * Format: FM-{id zero-padded to 9 digits}
 */
export function generateMemberCode(telegram_user_id: string): string {
  const numeric = telegram_user_id.replace(/\D/g, "");
  return `FM-${numeric.padStart(9, "0")}`;
}

export async function findByTelegramId(
  telegram_user_id: string
): Promise<Member | undefined> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("telegram_user_id", telegram_user_id)
    .maybeSingle();

  if (error) {
    console.error("[member-repository] findByTelegramId error:", error);
    throw error;
  }

  return data ? rowToMember(data as MemberRow) : undefined;
}

export async function findByMemberCode(
  member_code: string
): Promise<Member | undefined> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("member_code", member_code)
    .maybeSingle();

  if (error) {
    console.error("[member-repository] findByMemberCode error:", error);
    throw error;
  }

  return data ? rowToMember(data as MemberRow) : undefined;
}

/**
 * Inserts or fully replaces a member record.
 */
export async function saveMember(member: Member): Promise<Member> {
  const payload = {
    telegram_user_id: member.telegram_user_id,
    member_code: member.member_code,
    status: member.status,
    total_eur_valid: member.total_eur_valid,
    elector_since: member.elector_since,
    can_vote_from: member.can_vote_from,
    wallet_address: member.wallet_address,
    first_valid_tx_hash: member.first_valid_tx_hash,
    last_tx_hash: member.last_tx_hash,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("members")
    .upsert(payload, { onConflict: "telegram_user_id" });

  if (error) {
    console.error("[member-repository] saveMember error:", error);
    throw error;
  }

  return member;
}
