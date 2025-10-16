import { motion } from "motion/react";
import type { ReactNode } from "react";
import { SuggestionPills } from "./suggestion-pills";

interface EmptyStateProps {
  children: ReactNode;
  onSuggestionClick?: (suggestion: string) => void;
}

export function EmptyState({ children, onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full px-4 max-w-2xl space-y-8">
        <motion.h1
          className="text-[32px] text-center font-mono"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          What would you like to know?
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {children}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <SuggestionPills onSuggestionClick={onSuggestionClick} />
        </motion.div>
      </div>
    </div>
  );
}