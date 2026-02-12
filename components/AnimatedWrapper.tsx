"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";

type AnimatedWrapperProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  variant?: "default" | "product-card" | "section";
}>;

const luxuryEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function AnimatedWrapper({
  children,
  className,
  delay = 0,
  variant = "default",
}: AnimatedWrapperProps) {
  const reduceMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  if (variant === "product-card") {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: luxuryEase, delay }}
      >
        {children}
      </motion.div>
    );
  }

  if (variant === "section") {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.24, ease: luxuryEase, delay }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.28, ease: luxuryEase, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function GlobalAnimatedWrapper({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || reduceMotion) {
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
