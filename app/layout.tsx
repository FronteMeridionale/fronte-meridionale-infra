import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fronte Meridionale",
  description:
    "Partecipa al movimento civico Fronte Meridionale e contribuisci al futuro del Sud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
