import Link from "next/link";
import { Music2 } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav-links";
import { InstagramIcon, WhatsAppIcon } from "@/components/BrandIcons";
import { buildWhatsAppEnquiryLink } from "@/lib/whatsapp";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/norvilahcake", Icon: InstagramIcon },
  { label: "TikTok", href: "https://tiktok.com/@norvilah.ng", Icon: Music2 },
  { label: "WhatsApp", href: buildWhatsAppEnquiryLink(null), Icon: WhatsAppIcon },
];

// Section 8 in one component: the "still thinking about it?" CTA and
// the footer share the same cocoa block with no seam between them.
export default function FooterSection() {
  return (
    <section id="contact" className="bg-cocoa">
      <div className="mx-auto max-w-content px-6 py-24 text-center md:py-40">
        <h2 className="font-display text-heading text-plaster">
          Still thinking about it?
        </h2>
        <p className="mt-3 font-body text-lead text-plaster/80">
          Your next craving is only a click away.
        </p>
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-pill bg-plaster px-8 py-3.5 font-body font-medium text-cocoa transition-colors duration-200 hover:bg-cream"
        >
          Order Now
        </Link>
      </div>

      <div className="mx-auto max-w-content px-6 pb-16">
        <div className="grid gap-12 border-t border-plaster/15 pt-16 md:grid-cols-3">
          <div>
            <p className="font-display text-product text-plaster">Norvilah Cakes</p>
            <p className="mt-2 font-body text-small text-plaster/70">
              Good food. Brighter days.
            </p>
          </div>

          <nav className="flex flex-col gap-3 font-body text-small text-plaster/80">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-plaster">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-full border border-plaster/30 text-plaster transition-colors hover:border-plaster"
                >
                  <Icon className="size-5" strokeWidth={1.5} />
                </a>
              ))}
            </div>
            <p className="font-body text-small text-plaster/70">Lagos, Nigeria</p>
            <a
              href="tel:+2348166603466"
              className="font-body text-small text-plaster/70 hover:text-plaster"
            >
              08166603466
            </a>
          </div>
        </div>

        <p className="mt-16 text-center font-body text-small text-clay">
          2026 Norvilah Cakes. All rights reserved.
        </p>
      </div>
    </section>
  );
}
