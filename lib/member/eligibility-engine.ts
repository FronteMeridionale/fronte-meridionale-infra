/**
 * Aggiunge esattamente N mesi a una data, gestendo correttamente i casi limite
 * di fine mese (es. 31 agosto + 6 mesi = 28/29 febbraio, non 2/3 marzo).
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // Se il giorno è cambiato, significa che il mese di destinazione ha meno giorni:
  // regressiamo all'ultimo giorno del mese corretto.
  if (result.getDate() !== date.getDate()) {
    result.setDate(0);
  }
  return result;
}

/**
 * Verifica se il membro ha diritto di voto.
 * Il diritto di voto diventa attivo 6 mesi dopo la data di inizio status "elector".
 *
 * @param elector_since - Data ISO in cui il membro ha raggiunto lo status "elector" (null se non ancora elector)
 * @param now - Data corrente (default: new Date())
 * @returns true se il diritto di voto è attivo, false altrimenti
 */
export function canVote(
  elector_since: string | null,
  now: Date = new Date()
): boolean {
  if (!elector_since) {
    return false;
  }

  const sixMonthsLater = addMonths(new Date(elector_since), 6);
  return now >= sixMonthsLater;
}

/**
 * Calcola la data a partire dalla quale il diritto di voto sarà attivo.
 *
 * @param elector_since - Data ISO in cui il membro ha raggiunto lo status "elector"
 * @returns Stringa ISO della data in cui il voto diventa attivo, o null
 */
export function calculateCanVoteFrom(
  elector_since: string | null
): string | null {
  if (!elector_since) {
    return null;
  }

  return addMonths(new Date(elector_since), 6).toISOString();
}
