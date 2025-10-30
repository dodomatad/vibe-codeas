import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe AI Generator - Gerador de Código AI",
  description: "Gerador de código AI poderoso e sem bugs. Melhor que Cursor e Lovable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
