import ParticipationButton from "@/components/participation/ParticipationButton";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-stone-50 px-6 py-24 text-center">
      <div className="max-w-xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-green-800 sm:text-5xl">
          Fronte Meridionale
        </h1>
        <p className="text-xl leading-relaxed text-stone-700">
          Un movimento civico per il rinascimento del Sud. Entra a far parte
          della comunità, sostieni il progetto e conquista il tuo diritto di
          voto.
        </p>
        <div className="pt-4">
          <ParticipationButton />
        </div>
      </div>
    </main>
  );
}
