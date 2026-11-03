import { Metadata } from "next";
import { SolarViewer } from "@/components/solar/SolarViewer";

export const metadata: Metadata = {
  title: "Układ Słoneczny 3D - Galacti",
  description: "Trójwymiarowy model Układu Słonecznego z planetami i orbitami w skali opartej o dane NASA.",
};

export default function SolarSystemPage() {
  return <SolarViewer />;
}
