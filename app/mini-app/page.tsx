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

export default function MiniApp() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      setError("Apri questa pagina dal bot Telegram per accedere alla Mini App.");
      setLoading(false);
      return;
    }

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
  }, []);

  async function handleParticipate() {
    if (!initData || participating) return;

    setParticipating(true);
    setError(null);

    try {
      const res = await fetch("/api/member/participate", {
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
        let message = "Errore nella richiesta.";

        try {
          const body = (await res.json()) as { error?: string };
          message = body.error ?? message;
        } catch {
          // nessuna azione necessaria
        }

        setError(message);
        return;
      }

      const updated = (await res.json()) as Member;
      setMember(updated);
    } catch (err) {
      console.error("[MiniApp] participate error:", err);
      setError("Errore di rete. Riprova.");
    } finally {
      setParticipating(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-500">Caricamento…</p>
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

        <button
          onClick={handleParticipate}
          disabled={participating}
          className="w-full rounded-full bg-green-700 px-10 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50"
        >
          {participating ? "Elaborazione…" : "Conferma partecipazione (+5€)"}
        </button>
      </div>
    </main>
  );
}
