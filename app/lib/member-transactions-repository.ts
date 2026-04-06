import { createClient } from "@supabase/supabase-js";
import {
  MemberTransaction,
  CreateMemberTransactionInput,
} from "@/types/member-transactions";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL non configurato");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY non configurato");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function rowToTransaction(row: Record<string, unknown>): MemberTransaction {
  return {
    id: row.id as number,
    telegram_user_id: row.telegram_user_id as string,
    member_code: row.member_code as string,
    declared_role: (row.declared_role as "supporter" | "elector") ?? null,
    tx_hash: row.tx_hash as string,
    blockchain: row.blockchain as string,
    asset: row.asset as string,
    amount_asset: Number(row.amount_asset),
    amount_eur: Number(row.amount_eur),
    wallet_address_from: (row.wallet_address_from as string) ?? null,
    wallet_address_to: row.wallet_address_to as string,
    treasury_wallet_address: row.treasury_wallet_address as string,
    tx_comment: (row.tx_comment as string) ?? null,
    tx_timestamp: row.tx_timestamp as string,
    calendar_year: row.calendar_year as number,
    is_valid: row.is_valid as boolean,
    validation_reason: (row.validation_reason as string) ?? null,
    validated_at: (row.validated_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function createMemberTransaction(
  input: CreateMemberTransactionInput
): Promise<MemberTransaction> {
  const payload = {
    telegram_user_id: input.telegram_user_id,
    member_code: input.member_code,
    declared_role: input.declared_role,
    tx_hash: input.tx_hash,
    blockchain: input.blockchain ?? "ton",
    asset: input.asset,
    amount_asset: input.amount_asset,
    amount_eur: input.amount_eur,
    wallet_address_from: input.wallet_address_from,
    wallet_address_to: input.wallet_address_to,
    treasury_wallet_address: input.treasury_wallet_address,
    tx_comment: input.tx_comment,
    tx_timestamp: input.tx_timestamp,
    calendar_year: input.calendar_year,
    is_valid: input.is_valid,
    validation_reason: input.validation_reason,
    validated_at: input.validated_at,
  };

  const { data, error } = await supabase
    .from("member_transactions")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[member-transactions-repository] createMemberTransaction error:", error);
    throw error;
  }

  return rowToTransaction(data as Record<string, unknown>);
}

export async function findTransactionByHash(
  tx_hash: string
): Promise<MemberTransaction | undefined> {
  const { data, error } = await supabase
    .from("member_transactions")
    .select("*")
    .eq("tx_hash", tx_hash)
    .maybeSingle();

  if (error) {
    console.error("[member-transactions-repository] findTransactionByHash error:", error);
    throw error;
  }

  return data ? rowToTransaction(data as Record<string, unknown>) : undefined;
}

export async function findValidTransactionsByTelegramUserIdAndYear(
  telegram_user_id: string,
  year: number
): Promise<MemberTransaction[]> {
  const { data, error } = await supabase
    .from("member_transactions")
    .select("*")
    .eq("telegram_user_id", telegram_user_id)
    .eq("calendar_year", year)
    .eq("is_valid", true);

  if (error) {
    console.error(
      "[member-transactions-repository] findValidTransactionsByTelegramUserIdAndYear error:",
      error
    );
    throw error;
  }

  return (data ?? []).map((row) => rowToTransaction(row as Record<string, unknown>));
}

export async function sumValidTransactionsEurByTelegramUserIdAndYear(
  telegram_user_id: string,
  year: number
): Promise<number> {
  const { data, error } = await supabase
    .from("member_transactions")
    .select("amount_eur")
    .eq("telegram_user_id", telegram_user_id)
    .eq("calendar_year", year)
    .eq("is_valid", true);

  if (error) {
    console.error(
      "[member-transactions-repository] sumValidTransactionsEurByTelegramUserIdAndYear error:",
      error
    );
    throw error;
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount_eur), 0);
}

export async function updateTransactionValidation(
  id: number,
  is_valid: boolean,
  validation_reason: string
): Promise<void> {
  const { error } = await supabase
    .from("member_transactions")
    .update({
      is_valid,
      validation_reason,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(
      "[member-transactions-repository] updateTransactionValidation error:",
      error
    );
    throw error;
  }
}
