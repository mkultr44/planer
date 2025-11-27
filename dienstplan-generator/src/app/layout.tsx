import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Dienstplan Generator",
  description:
    "Erstelle Mitarbeitendenprofile und generiere Dienstpläne, die Verfügbarkeiten, Feiertage und Stundenkontingente automatisch berücksichtigen."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.variable} min-h-screen bg-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
