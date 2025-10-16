import { motion } from "motion/react";
import type { ReactNode } from "react";
import { SuggestionPills } from "./suggestion-pills";

interface EmptyStateProps {
  children: ReactNode;
  onSuggestionClick?: (suggestion: string) => void;
  isAuthenticated?: boolean;
}

export function EmptyState({ children, onSuggestionClick, isAuthenticated = true }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full px-4 max-w-2xl space-y-6">
        <motion.h1
          className="text-xl text-center font-mono text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {isAuthenticated
            ? "Employee Assistant - Ready to help"
            : "Employee Portal - Sign in to get started"
          }
        </motion.h1>

        {!isAuthenticated && (
          <motion.div
            className="bg-muted/50 rounded-lg p-4 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="text-sm font-medium text-foreground">
              Authentication Required
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <code className="bg-background px-2 py-1 rounded">/signin username password</code>
                <span>Sign in to existing account</span>
              </div>
              <div className="flex items-center justify-between">
                <code className="bg-background px-2 py-1 rounded">/signup email username password</code>
                <span>Create new account</span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {children}
        </motion.div>

        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <SuggestionPills onSuggestionClick={onSuggestionClick} />
          </motion.div>
        )}
      </div>
    </div>
  );
}