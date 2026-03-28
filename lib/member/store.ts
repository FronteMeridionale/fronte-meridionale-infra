import { Member } from "@/types/member";

/**
 * Store in-memory dei membri.
 * In produzione questo verrà sostituito da un database persistente.
 */
const membersStore = new Map<string, Member>();

/**
 * Genera un codice membro univoco, verificando l'assenza di collisioni nello store.
 */
export function generateMemberCode(): string {
  let code: string;
  do {
    const random = Math.random().toString(36).slice(2, 9).toUpperCase();
    code = `FM-${Date.now()}-${random}`;
  } while (membersStore.has(code));
  return code;
}

/**
 * Trova un membro per telegram_user_id.
 */
export function findByTelegramId(telegram_user_id: string): Member | undefined {
  for (const member of membersStore.values()) {
    if (member.telegram_user_id === telegram_user_id) {
      return member;
    }
  }
  return undefined;
}

/**
 * Trova un membro per member_code.
 */
export function findByMemberCode(member_code: string): Member | undefined {
  return membersStore.get(member_code);
}

/**
 * Salva o aggiorna un membro nello store.
 */
export function saveMember(member: Member): Member {
  membersStore.set(member.member_code, member);
  return member;
}
