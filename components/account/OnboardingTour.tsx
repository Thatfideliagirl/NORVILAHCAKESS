"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageCircle, PackageCheck, PartyPopper, Sparkles, X } from "lucide-react";

type TourTarget = "orders" | "inquiries" | "messages";

type Step = {
  icon: typeof PartyPopper;
  title: string;
  body: string;
  target: TourTarget | null;
};

const STEPS: Step[] = [
  {
    icon: PartyPopper,
    title: "Welcome to Norvilah Cakes",
    body: "We're so glad you're here. Give us a moment to show you around your new account.",
    target: null,
  },
  {
    icon: PackageCheck,
    title: "Track your orders",
    body: "Everything you order shows up here, from placed to delivered. Tap any order for the full details.",
    target: "orders",
  },
  {
    icon: Sparkles,
    title: "Planning something special?",
    body: "Send us the details for a custom cake or event here, and we'll get back to you right in your account.",
    target: "inquiries",
  },
  {
    icon: MessageCircle,
    title: "We're always a message away",
    body: "Tap here anytime you have a question. We reply right here in your account.",
    target: "messages",
  },
];

const TOOLTIP_WIDTH = 288;
const GUTTER = 16;

function findVisibleTarget(key: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`);
  for (const node of nodes) {
    if (node.offsetParent !== null) return node;
  }
  return null;
}

export default function OnboardingTour({
  name,
  onFinish,
  onSetDrawerOpen,
}: {
  name: string;
  onFinish: () => void;
  onSetDrawerOpen: (open: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;
  const needsDrawer = current.target !== null;

  // The nav items this tour points at live inside the mobile drawer on
  // small screens -- it's closed by default, so open it for the steps
  // that need to highlight something inside it, and close it again once
  // we're back to a centered step or the tour ends.
  useEffect(() => {
    onSetDrawerOpen(needsDrawer);
  }, [needsDrawer, onSetDrawerOpen]);

  useEffect(() => {
    return () => onSetDrawerOpen(false);
  }, [onSetDrawerOpen]);

  useEffect(() => {
    const target = current.target;
    if (!target) {
      Promise.resolve().then(() => setRect(null));
      return;
    }
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const el = findVisibleTarget(target);
      if (el) setRect(el.getBoundingClientRect());
    };
    // Give the drawer's open animation time to finish before measuring,
    // otherwise we'd point at where the item is about to be, not where it is.
    const timeout = setTimeout(measure, 340);
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const tooltipPosition = (() => {
    if (!rect || typeof window === "undefined") return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(GUTTER, Math.min(rect.left, vw - TOOLTIP_WIDTH - GUTTER));
    const spaceBelow = vh - rect.bottom;
    const placeBelow = spaceBelow > 240 || spaceBelow > rect.top;
    return placeBelow
      ? { left, top: rect.bottom + 12 }
      : { left, bottom: vh - rect.top + 12 };
  })();

  return (
    <AnimatePresence>
      {rect ? (
        <motion.div
          key="spotlight"
          className="pointer-events-none fixed z-[100] rounded-panel"
          animate={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ boxShadow: "0 0 0 9999px rgba(58,33,25,0.6)" }}
        />
      ) : (
        <motion.div
          key="dim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-cocoa/50"
          aria-hidden="true"
        />
      )}
      {rect && (
        <div key="catcher" className="fixed inset-0 z-[100]" aria-hidden="true" />
      )}

      <motion.div
        key={`tooltip-${step}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome tour"
        style={
          tooltipPosition
            ? { ...tooltipPosition, width: TOOLTIP_WIDTH }
            : undefined
        }
        className={
          tooltipPosition
            ? "fixed z-[110] rounded-panel bg-cream p-5 text-center shadow-warm-lg"
            : "fixed inset-x-4 top-1/2 z-[110] mx-auto max-w-sm -translate-y-1/2 rounded-panel bg-cream p-7 text-center shadow-warm-lg"
        }
      >
        <button
          type="button"
          onClick={onFinish}
          aria-label="Skip tour"
          className="absolute right-3 top-3 text-ink/40 transition-colors hover:text-berry"
        >
          <X className="size-5" strokeWidth={1.75} />
        </button>

        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose text-berry">
          <Icon className="size-6" strokeWidth={1.5} />
        </span>

        <p className="mt-4 font-display text-body text-berry">
          {isFirst ? `${current.title}, ${name.split(" ")[0]}!` : current.title}
        </p>
        <p className="mt-2 font-body text-small text-ink/70">{current.body}</p>

        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full transition-colors ${
                i === step ? "bg-berry" : "bg-clay/30"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`flex items-center gap-1 rounded-pill px-3 py-2 font-body text-small font-medium text-ink/60 ${
              isFirst ? "invisible" : ""
            }`}
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
            Back
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}
            className="flex items-center gap-1 rounded-pill bg-cocoa px-5 py-2.5 font-body text-small font-medium text-cream"
          >
            {isLast ? "Get started" : "Next"}
            {!isLast && <ChevronRight className="size-4" strokeWidth={1.75} />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
