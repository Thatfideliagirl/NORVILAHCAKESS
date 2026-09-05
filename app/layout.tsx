import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Sacramento } from "next/font/google";
import GrainOverlay from "@/components/GrainOverlay";
import SmoothScroll from "@/components/SmoothScroll";
import NavBar from "@/components/NavBar";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const sacramento = Sacramento({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sacramento",
  display: "swap",
});

const siteUrl = "https://norvilahcakes.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Norvilah Cakes — Freshly made, beautifully packaged",
  description:
    "Lagos bakery for cakes, cupcakes, parfaits, waffles, meat pies, banana bread and more, made fresh to order. Order on WhatsApp or browse the full menu.",
  openGraph: {
    title: "Norvilah Cakes",
    description:
      "More than treats. Moments of happiness. Cakes, parfaits, waffles and more, made fresh to order in Lagos.",
    url: siteUrl,
    siteName: "Norvilah Cakes",
    images: ["/hero-still.jpg"],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Norvilah Cakes",
    description: "Freshly made, beautifully packaged. Order on WhatsApp today.",
    images: ["/hero-still.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#3a241f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${sacramento.variable}`}
    >
      <body className="bg-cream text-ink antialiased">
        <GrainOverlay />
        <SmoothScroll>
          <NavBar />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
