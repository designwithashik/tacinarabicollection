"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

type AnimatedWrapperProps = PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

const luxuryEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function AnimatedWrapper({ children, className, delay = 0 }: AnimatedWrapperProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: luxuryEase, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function GlobalAnimatedWrapper({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.45, ease: luxuryEase }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
