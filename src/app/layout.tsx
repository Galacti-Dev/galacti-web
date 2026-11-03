import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090b",
};

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
    <html lang="pl" className="dark h-full max-w-full overflow-x-hidden">
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100 selection:bg-white selection:text-black max-w-full overflow-x-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
