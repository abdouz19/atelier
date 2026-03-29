'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';

export const SPRING = { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 } as const;

const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: SPRING },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className ?? 'flex-1 overflow-auto p-6'}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
