export type MemberStatus = "none" | "supporter" | "elector";

export interface Member {
  member_code: string;
  telegram_user_id: string;
  wallet_address: string | null;
  total_eur_valid: number;
  status: MemberStatus;
  elector_since: string | null;
  can_vote_from: string | null;
  first_valid_tx_hash: string | null;
  last_tx_hash: string | null;
}
