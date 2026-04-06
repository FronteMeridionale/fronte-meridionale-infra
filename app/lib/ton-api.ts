/**
 * TON API service for querying jetton transfers.
 * Uses TONAPI v2: https://tonapi.io/v2
 *
 * USDT on TON is a jetton with master address:
 * EQCxE6mUtQJKjGnYY5LqNGUTb-z6oB8oMvrqB2n7SKjp3wEE
 *
 * USDT has 6 decimals — 1 USDT = 1_000_000 in raw amount.
 */

export const USDT_MASTER_ADDRESS =
  "EQCxE6mUtQJKjGnYY5LqNGUTb-z6oB8oMvrqB2n7SKjp3wEE";

export const USDT_DECIMALS = 6;

export const USDT_SYMBOL = "USDT";

export interface TonJettonTransfer {
  /** Transaction hash (hex) */
  tx_hash: string;
  /** Unix timestamp (seconds) */
  tx_timestamp: number;
  /** Raw amount as string (divide by 10^decimals to get human-readable) */
  amount: string;
  /** Sender address (friendly format) */
  sender: string | null;
  /** Recipient address (friendly format) */
  recipient: string;
  /** Comment / memo attached to the transfer */
  comment: string | null;
  /** Jetton master address */
  jetton_address: string;
}

interface TonapiJettonTransfer {
  transaction_hash?: string;
  utime?: number;
  amount?: string;
  sender?: { address?: string };
  recipient?: { address?: string };
  comment?: string;
  jetton?: { address?: string };
}

interface TonapiResponse {
  transfers?: TonapiJettonTransfer[];
  events?: TonapiJettonTransfer[];
}

/**
 * Fetches jetton transfers received by `recipientAddress` for the USDT jetton.
 *
 * @param recipientAddress - The treasury wallet address (e.g. UQBbSnuUUKB4...)
 * @param limit            - Max number of transfers to fetch (default: 100)
 */
export async function fetchUsdtTransfersToWallet(
  recipientAddress: string,
  limit = 100
): Promise<TonJettonTransfer[]> {
  const apiKey = process.env.TONAPI_KEY;
  const baseUrl = "https://tonapi.io/v2";

  const url = `${baseUrl}/accounts/${encodeURIComponent(recipientAddress)}/jettons/${encodeURIComponent(USDT_MASTER_ADDRESS)}/transfers?direction=in&limit=${limit}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  console.log(`[ton-api] Fetching USDT transfers to ${recipientAddress}`);

  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[ton-api] HTTP ${response.status}: ${text}`);
    throw new Error(`TONAPI returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as TonapiResponse;

  const raw: TonapiJettonTransfer[] = data.transfers ?? data.events ?? [];
  // TONAPI v2 uses 'transfers' for account jetton transfer endpoints;
  // 'events' is kept as a fallback for alternative response shapes.

  return raw.map((t) => ({
    tx_hash: t.transaction_hash ?? "",
    tx_timestamp: t.utime ?? 0,
    amount: t.amount ?? "0",
    sender: t.sender?.address ?? null,
    recipient: t.recipient?.address ?? recipientAddress,
    comment: t.comment ?? null,
    jetton_address: t.jetton?.address ?? USDT_MASTER_ADDRESS,
  }));
}

/**
 * Converts a raw jetton amount string to a human-readable USDT number.
 * USDT has 6 decimals on TON.
 */
export function rawAmountToUsdt(rawAmount: string): number {
  return Number(rawAmount) / Math.pow(10, USDT_DECIMALS);
}
