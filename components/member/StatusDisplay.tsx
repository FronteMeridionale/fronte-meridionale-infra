import { Member } from "@/types/member";

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
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">Codice membro</span>
        <span className="font-mono text-sm font-semibold text-gray-800">
          {member.member_code}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Stato</span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColors[member.status]}`}
        >
          {statusLabels[member.status] ?? member.status}
        </span>
      </div>
    </div>
  );
}
