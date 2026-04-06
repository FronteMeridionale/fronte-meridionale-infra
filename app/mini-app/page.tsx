"use client";

import { useEffect, useState } from "react";

interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  ready: () => void;
  close: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

type MemberStatus = "none" | "supporter" | "elector";

interface Member {
  member_code: string;
  status: MemberStatus;
  total_eur_valid: number;
  elector_since: string | null;
}

const STATUS_LABELS: Record<MemberStatus, string> = {
  none: "⚪ Partecipazione non ancora attiva",
  supporter: "💙 Sostenitore",
  elector: "🟢 Elettore",
};

const TREASURY_WALLET = "UQBbSnuUUKB4gKwKAdFJd8JglUoY40dfLCWFr4kr0geOGKm5";
const MIN_USDT = 15;
const BUY_USDT_URL = "https://www.bybit.com/en/trade/spot/USDT/TON";

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("aria-label", "Testo copiato negli appunti");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

export default function MiniApp() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [isTelegramContext, setIsTelegramContext] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  function closeModal() {
    setShowModal(false);
    setVerifyMessage(null);
    setError(null);
  }

  useEffect(() => {
    if (!showModal) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      setIsTelegramContext(true);
      tg.ready();
      tg.expand();

      const rawInitData = tg.initData ?? "";
      setInitData(rawInitData);

      const userId = tg.initDataUnsafe?.user?.id;

      if (!userId) {
        setError("Dati utente Telegram non trovati. Riapri la Mini App dal bot.");
        setLoading(false);
        return;
      }

      const controller = new AbortController();

      fetch(`/api/member/status?telegram_user_id=${userId}`, {
        signal: controller.signal,
        cache: "no-store",
      })
        .then(async (r) => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}`);
          }
          return (await r.json()) as Member;
        })
        .then((data) => {
          setMember(data);
          setLoading(false);
        })
        .catch((err: unknown) => {
          console.error("[MiniApp] status error:", err);
          setError("Errore nel caricamento del profilo. Riprova.");
          setLoading(false);
        });

      return () => controller.abort();
    }

    setIsTelegramContext(false);
    setError(
      "Questa pagina è stata aperta fuori dalla Mini App Telegram. Per il test completo aprila dal bot."
    );
    setLoading(false);
  }, []);

  async function handleCopyWallet() {
    try {
      await copyToClipboard(TREASURY_WALLET);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } catch {
      // nessuna azione necessaria
    }
  }

  async function handleCopyMemo() {
    if (!member?.member_code) return;
    try {
      await copyToClipboard(member.member_code);
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
    } catch {
      // nessuna azione necessaria
    }
  }

  async function handleVerifyTransaction() {
    if (!initData || verifying) return;

    setVerifying(true);
    setVerifyMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/member/verify-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ initData }),
      });

      if (res.status === 429) {
        setError("Troppe richieste. Attendi un momento.");
        return;
      }

      if (!res.ok) {
        let message = "Errore nella verifica.";
        try {
          const body = (await res.json()) as { error?: string };
          message = body.error ?? message;
        } catch {
          // nessuna azione necessaria
        }
        setError(message);
        return;
      }

      const result = (await res.json()) as {
        status: "supporter" | "elector" | "pending";
        total_valid?: number;
        message?: string;
      };

      if (result.status === "pending") {
        setVerifyMessage(
          result.message ??
            "Transazione non trovata. Assicurati di aver inviato almeno 15 USDT con il tuo codice membro nel campo memo."
        );
      } else {
        setMember((prev) =>
          prev
            ? {
                ...prev,
                status: result.status as "supporter" | "elector",
                total_eur_valid: result.total_valid ?? prev.total_eur_valid,
              }
            : prev
        );
        setVerifyMessage(null);
        setShowModal(false);
      }
    } catch (err) {
      console.error("[MiniApp] verify-transaction error:", err);
      setError("Errore di rete. Riprova.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-500">Caricamento…</p>
      </main>
    );
  }

  if (!isTelegramContext) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-green-800">
            Fronte Meridionale
          </h1>
          <p className="text-sm text-red-600">{error}</p>
          <p className="mt-4 text-sm text-gray-600">
            Torna su Telegram e apri la Mini App dal bot ufficiale.
          </p>
        </div>
      </main>
    );
  }

  if (error && !member) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <p className="text-center text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-bold text-green-800">
          Fronte Meridionale
        </h1>

        {member && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Codice membro</span>
              <span className="font-mono text-sm font-semibold text-gray-800">
                {member.member_code}
              </span>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Stato</span>
              <span className="text-sm font-semibold text-gray-800">
                {STATUS_LABELS[member.status]}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Totale valido</span>
              <span className="text-sm font-semibold text-gray-800">
                {member.total_eur_valid}€
              </span>
            </div>

            {member.status === "elector" && member.elector_since && (
              <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
                📅 Elettore dal:{" "}
                {new Date(member.elector_since).toLocaleDateString("it-IT")}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        {member?.status === "none" && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full rounded-full bg-green-700 px-10 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            💚 Diventa sostenitore
          </button>
        )}
      </div>

      {/* Modal */}
      {showModal && member && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
        >
          <div className="w-full max-w-md rounded-t-3xl bg-white px-6 pb-10 pt-6 shadow-xl sm:rounded-3xl">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                💚 Diventa sostenitore
              </h2>
              <button
                onClick={closeModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            {/* Step 1 */}
            <div className="mb-4 rounded-xl bg-blue-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                Passo 1 — Importo minimo
              </p>
              <p className="text-base font-bold text-gray-900">
                {MIN_USDT} USDT sulla rete TON
              </p>
              <a
                href={BUY_USDT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                🛒 Compra USDT
              </a>
            </div>

            {/* Step 2 */}
            <div className="mb-4 rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Passo 2 — Wallet tesoreria
              </p>
              <p className="break-all font-mono text-sm text-gray-800">
                {TREASURY_WALLET}
              </p>
              <button
                onClick={handleCopyWallet}
                className="mt-2 rounded-full bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {copiedWallet ? "✅ Copiato!" : "📋 Copia wallet"}
              </button>
            </div>

            {/* Step 3 */}
            <div className="mb-5 rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Passo 3 — Memo da inserire
              </p>
              <p className="font-mono text-sm font-bold text-gray-800">
                {member.member_code}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Inserisci questo codice nel campo <em>memo</em> / <em>comment</em> della transazione.
              </p>
              <button
                onClick={handleCopyMemo}
                className="mt-2 rounded-full bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {copiedMemo ? "✅ Copiato!" : "📋 Copia memo"}
              </button>
            </div>

            {/* Feedback messages */}
            {verifyMessage && (
              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                ⚠️ {verifyMessage}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                ❌ {error}
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={handleVerifyTransaction}
              disabled={verifying || !initData}
              className="w-full rounded-full bg-blue-700 px-10 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Verifica in corso…
                </span>
              ) : (
                "✅ Ho inviato la transazione"
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
