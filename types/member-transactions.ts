export interface MemberTransaction {
  id: number;
  telegram_user_id: string;
  member_code: string;
  declared_role: "supporter" | "elector" | null;
  tx_hash: string;
  blockchain: string;
  asset: string;
  amount_asset: number;
  amount_eur: number;
  wallet_address_from: string | null;
  wallet_address_to: string;
  treasury_wallet_address: string;
  tx_comment: string | null;
  tx_timestamp: string;
  calendar_year: number;
  is_valid: boolean;
  validation_reason: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberTransactionInput {
  telegram_user_id: string;
  member_code: string;
  declared_role: "supporter" | "elector" | null;
  tx_hash: string;
  blockchain?: string;
  asset: string;
  amount_asset: number;
  amount_eur: number;
  wallet_address_from: string | null;
  wallet_address_to: string;
  treasury_wallet_address: string;
  tx_comment: string | null;
  tx_timestamp: string;
  calendar_year: number;
  is_valid: boolean;
  validation_reason: string | null;
  validated_at: string | null;
}
