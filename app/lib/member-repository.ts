import { Member, MemberStatus } from "@/types/member";
import { getDb } from "./db";

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
    total_eur_valid: row.total_eur_valid,
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

export function findByTelegramId(telegram_user_id: string): Member | undefined {
  const row = getDb()
    .prepare("SELECT * FROM members WHERE telegram_user_id = ?")
    .get(telegram_user_id) as MemberRow | undefined;
  return row ? rowToMember(row) : undefined;
}

export function findByMemberCode(member_code: string): Member | undefined {
  const row = getDb()
    .prepare("SELECT * FROM members WHERE member_code = ?")
    .get(member_code) as MemberRow | undefined;
  return row ? rowToMember(row) : undefined;
}

/**
 * Inserts or fully replaces a member record.
 */
export function saveMember(member: Member): Member {
  getDb()
    .prepare(
      `INSERT INTO members
         (telegram_user_id, member_code, status, total_eur_valid,
          elector_since, can_vote_from, wallet_address,
          first_valid_tx_hash, last_tx_hash)
       VALUES
         (@telegram_user_id, @member_code, @status, @total_eur_valid,
          @elector_since, @can_vote_from, @wallet_address,
          @first_valid_tx_hash, @last_tx_hash)
       ON CONFLICT(telegram_user_id) DO UPDATE SET
         member_code         = excluded.member_code,
         status              = excluded.status,
         total_eur_valid     = excluded.total_eur_valid,
         elector_since       = excluded.elector_since,
         can_vote_from       = excluded.can_vote_from,
         wallet_address      = excluded.wallet_address,
         first_valid_tx_hash = excluded.first_valid_tx_hash,
         last_tx_hash        = excluded.last_tx_hash,
         updated_at          = datetime('now')`
    )
    .run(member);
  return member;
}
