export const motionTokens = {
  duration: {
    instant: 0.12,
    fast: 0.2,
    base: 0.35,
    slow: 0.55,
    slower: 0.8,
    hero: 18,
  },
  ease: {
    out: [0.22, 1, 0.36, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
    soft: [0.33, 1, 0.68, 1] as const,
    premium: [0.16, 1, 0.3, 1] as const,
  },
  spring: {
    soft: { type: "spring" as const, stiffness: 280, damping: 28, mass: 0.8 },
    snappy: { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.7 },
    gentle: { type: "spring" as const, stiffness: 180, damping: 24, mass: 1 },
  },
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.ease.premium,
    },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.ease.out,
    },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.ease.premium,
    },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const staggerFast = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

export const cardHover = {
  rest: {
    y: 0,
    rotate: 0,
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  },
  hover: {
    y: -8,
    rotate: 1,
    boxShadow: "0 28px 60px rgba(200,164,106,0.18)",
    transition: motionTokens.spring.soft,
  },
};

export const floatSubtle = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 12, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.ease.premium,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.ease.inOut,
    },
  },
};

export const reducedMotion = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};
