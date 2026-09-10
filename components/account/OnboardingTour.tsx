"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  PackageCheck,
  PartyPopper,
  Sparkles,
  X,
} from "lucide-react";

type Step = {
  icon: typeof PartyPopper;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: PartyPopper,
    title: "Welcome to Norvilah Cakes",
    body: "We're so glad you're here. Give us a moment to show you around your new account.",
  },
  {
    icon: PackageCheck,
    title: "Track your orders",
    body: "Everything you order shows up under My Orders, from placed to delivered. Tap any order for the full details.",
  },
  {
    icon: Sparkles,
    title: "Planning something special?",
    body: 'Send us the details for a custom cake or event under My Inquiries, and we’ll get back to you right here.',
  },
  {
    icon: MessageCircle,
    title: "We're always a message away",
    body: 'Tap "Chat with us" at the top of your account, or the Messages tab, anytime you have a question. We reply right here.',
  },
];

export default function OnboardingTour({
  name,
  onFinish,
}: {
  name: string;
  onFinish: () => void;
}) {
  const [step, setStep] = useState(0);
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-cocoa/50"
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome tour"
        className="fixed inset-x-4 top-1/2 z-[110] mx-auto max-w-sm -translate-y-1/2 rounded-panel bg-cream p-7 text-center shadow-warm-lg"
      >
        <button
          type="button"
          onClick={onFinish}
          aria-label="Skip tour"
          className="absolute right-4 top-4 text-ink/40 transition-colors hover:text-berry"
        >
          <X className="size-5" strokeWidth={1.75} />
        </button>

        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose text-berry">
          <Icon className="size-7" strokeWidth={1.5} />
        </span>

        <p className="mt-5 font-display text-product text-berry">
          {isFirst ? `${current.title}, ${name.split(" ")[0]}!` : current.title}
        </p>
        <p className="mt-3 font-body text-body text-ink/70">{current.body}</p>

        <div className="mt-6 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full transition-colors ${
                i === step ? "bg-berry" : "bg-clay/30"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`flex items-center gap-1 rounded-pill px-4 py-2 font-body text-small font-medium text-ink/60 ${
              isFirst ? "invisible" : ""
            }`}
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
            Back
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}
            className="flex items-center gap-1 rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream"
          >
            {isLast ? "Get started" : "Next"}
            {!isLast && <ChevronRight className="size-4" strokeWidth={1.75} />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
