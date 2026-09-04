// Shared motion constants, so every reveal on the site uses the same
// curve and timing instead of components inventing their own.
export const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;
export const REVEAL_DURATION = 0.6;
export const REVEAL_STAGGER = 0.07;

export const revealUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE },
  },
};

export const revealContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: REVEAL_STAGGER },
  },
};
