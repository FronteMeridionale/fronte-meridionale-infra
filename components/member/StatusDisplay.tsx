import { Member } from "@/types/member";
import { canVote } from "@/lib/member/eligibility-engine";

interface StatusDisplayProps {
  member: Member;
}

const statusLabels: Record<string, string> = {
  none: "Non iscritto",
  supporter: "Sostenitore",
  elector: "Elettore",
};

const statusColors: Record<string, string> = {
  none: "bg-gray-100 text-gray-700",
  supporter: "bg-blue-100 text-blue-800",
  elector: "bg-green-100 text-green-800",
};

export default function StatusDisplay({ member }: StatusDisplayProps) {
  const hasVoteRight = canVote(member.elector_since);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">Codice membro</span>
        <span className="font-mono text-sm font-semibold text-gray-800">
          {member.member_code}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">Stato</span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColors[member.status]}`}
        >
          {statusLabels[member.status] ?? member.status}
        </span>
      </div>

      {member.status === "elector" && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          {hasVoteRight ? (
            <p className="font-semibold text-green-700">
              ✓ Hai diritto di voto attivo
            </p>
          ) : (
            <p>
              Diritto di voto disponibile dal{" "}
              <span className="font-semibold">
                {member.can_vote_from
                  ? new Date(member.can_vote_from).toLocaleDateString("it-IT")
                  : "—"}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
