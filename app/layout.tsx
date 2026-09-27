import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Manrope, Sacramento } from "next/font/google";
import GrainOverlay from "@/components/GrainOverlay";
import SmoothScroll from "@/components/SmoothScroll";
import NavBar from "@/components/NavBar";
import HelpButton from "@/components/HelpButton";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import BackToDashboardLink from "@/components/BackToDashboardLink";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
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
      className={`${cormorant.variable} ${manrope.variable} ${sacramento.variable}`}
    >
      <body className="bg-cream text-ink antialiased">
        {/* TikTok Pixel -- lets TikTok attribute site visits/orders back
            to Novilah's ad campaigns. Loads after the page is
            interactive, same as how analytics scripts are normally
            added, so it never delays the page itself rendering. */}
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
            var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
            ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

              ttq.load('DASI9L3C77U88MSO8TTG');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
        <GrainOverlay />
        <SmoothScroll>
          <NavBar />
          <BackToDashboardLink />
          {children}
          <HelpButton />
          <AnnouncementPopup />
        </SmoothScroll>
      </body>
    </html>
  );
}
