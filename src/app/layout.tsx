import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agenzia Italia 2 - Servizi Clienti",
  description: "Piattaforma professionale per la gestione dei servizi clienti AI2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="fixed top-2 left-2 z-50 text-xs font-mono text-zinc-600 select-none pointer-events-none">
          v1.0.40
        </div>
        {children}
      </body>
    </html>
  );
}
