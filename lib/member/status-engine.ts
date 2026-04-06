import { MemberStatus } from "@/types/member";

/**
 * Calcola lo status del membro in base al totale dei contributi validati in EUR.
 *
 * - total_eur_valid < 15  → "none"
 * - total_eur_valid >= 15 → "supporter"
 * - total_eur_valid >= 50 → "elector"
 */
export function calculateMemberStatus(total_eur_valid: number): MemberStatus {
  if (total_eur_valid >= 50) {
    return "elector";
  }
  if (total_eur_valid >= 15) {
    return "supporter";
  }
  return "none";
}
