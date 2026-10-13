import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SILLAGE_URL ?? "https://sillage-raoul.vercel.app"),
  title: { default: "Sillage — chaque jour, une trace qui avance", template: "%s · Sillage" },
  description:
    "Le poste de pilotage d'une recherche d'alternance ou d'emploi : cibles sourcées, candidatures et relances automatiques, LinkedIn trois fois par jour, agents IA branchés en MCP.",
  openGraph: { type: "website", locale: "fr_FR", siteName: "Sillage" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#05080f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ecume focus:px-4 focus:py-2 focus:text-black">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
