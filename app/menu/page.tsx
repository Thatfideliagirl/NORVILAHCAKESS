import { Suspense } from "react";
import type { Metadata } from "next";
import MenuHero from "@/components/menu/MenuHero";
import MenuExperience from "@/components/menu/MenuExperience";

export const metadata: Metadata = {
  title: "Menu — Norvilah Cakes",
  description:
    "Browse the full Norvilah Cakes menu: cakes, cupcakes, parfaits, meat pies, waffles, yoghurt, banana bread, small chops and granola, made fresh to order.",
};

export default function MenuPage() {
  return (
    <main>
      <MenuHero />
      <Suspense>
        <MenuExperience />
      </Suspense>
    </main>
  );
}
