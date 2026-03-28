"use client";

interface ParticipationButtonProps {
  label?: string;
  onClick?: () => void;
}

export default function ParticipationButton({
  label = "Partecipa",
  onClick,
}: ParticipationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-green-700 px-10 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300"
    >
      {label}
    </button>
  );
}
