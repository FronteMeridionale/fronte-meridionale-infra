# fronte-meridionale-infra
Infrastruttura Telegram-first per la partecipazione al Fronte Meridionale.  Il sistema consente agli utenti di entrare tramite Telegram, registrare la propria partecipazione con una transazione verificabile e ottenere uno status (sostenitore o elettore) la transazione confluisce nel wallet tesoreria. Il registro membri è la base per il futuro sistema di voto della Front DAO.

## Architettura

- **Backend**: Next.js (hosted on Render)
- **Database**: Supabase (PostgreSQL)
- **Bot**: Telegram Bot (`telegram-bot/src/bot.ts`)
- **Mini App**: Telegram Mini App (`app/mini-app/page.tsx`)

## Flusso di adesione (Modalità B — verifica manuale on-chain)

1. L'utente apre la Mini App dal bot Telegram.
2. Invia almeno **15 USDT** via TON al wallet tesoreria, inserendo il proprio **codice membro** nel campo memo della transazione.
3. Preme il pulsante **"Ho inviato la transazione"** nella Mini App.
4. Il backend interroga la blockchain TON tramite TONAPI, filtra i jetton transfer USDT verso la tesoreria con il codice membro corretto e importo ≥ 15 USDT.
5. Se trovata, la transazione viene registrata nel database e lo status del membro viene aggiornato.

### Status membro

| Status     | Condizione                                |
|------------|-------------------------------------------|
| `none`     | Nessuna transazione valida nell'anno      |
| `supporter`| Totale annuo ≥ 15 USDT                   |
| `elector`  | Totale annuo ≥ 50 USDT                   |

### Wallet tesoreria

```
UQBbSnuUUKB4gKwKAdFJd8JglUoY40dfLCWFr4kr0geOGKm5
```

### Asset accettato

USDT (jetton su TON) — master address: `EQCxE6mUtQJKjGnYY5LqNGUTb-z6oB8oMvrqB2n7SKjp3wEE`

## API

### `POST /api/member/verify-transaction`

Verifica se il membro ha inviato una transazione USDT valida verso la tesoreria.

**Input** (JSON):
```json
{ "initData": "<Telegram WebApp initData>" }
```

**Output — transazione trovata**:
```json
{ "status": "supporter" | "elector", "total_valid": 15.0 }
```

**Output — transazione non trovata**:
```json
{ "status": "pending", "message": "Transazione non trovata..." }
```

### `POST /api/member/create`

Registra un nuovo membro (chiamato dal bot al comando `/start`).

### `GET /api/member/status?telegram_user_id=<id>`

Restituisce lo status attuale del membro.

### `POST /api/member/participate`

Endpoint legacy — non esegue accrediti automatici.

## Variabili d'ambiente

Vedi `.env.example` per la lista completa. Variabili principali:

| Variabile               | Descrizione                                      |
|------------------------|--------------------------------------------------|
| `TELEGRAM_BOT_TOKEN`   | Token bot da @BotFather                          |
| `SUPABASE_URL`         | URL del progetto Supabase                        |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase                  |
| `TONAPI_KEY`           | API key TONAPI (opzionale, evita rate limit)     |
| `TREASURY_WALLET`      | Wallet tesoreria TON (default già impostato)     |

## Database

### Tabella `members`

Registro organizzativo dei membri.

### Tabella `member_transactions`

Storico delle transazioni blockchain verificate. Schema in `supabase/migrations/002_member_transactions.sql`.
