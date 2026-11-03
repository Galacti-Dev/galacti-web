import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Galacti - Eksplorator Kosmosu i Układ Słoneczny 3D",
  description: "Interaktywny portal kosmiczny z wizualizacją 3D Układu Słonecznego, telemetrią ISS, APOD i startami rakiet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100 selection:bg-white selection:text-black">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
