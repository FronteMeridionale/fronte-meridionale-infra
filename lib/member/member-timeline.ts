/**
 * Aggiunge esattamente N mesi a una data, gestendo correttamente i casi limite
 * di fine mese (es. 31 agosto + 6 mesi = 28/29 febbraio, non 2/3 marzo).
 */
export function addMonths(date: Date, months: number): Date {
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
