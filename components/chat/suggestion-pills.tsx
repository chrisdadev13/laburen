"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "What are our return policies?",
  "How do I create a sales order?",
  "Show me recent orders",
  "Search company policies",
  "List available documentation",
  "Help me sign in to my account",
];

interface SuggestionPillsProps {
  onSuggestionClick?: (suggestion: string) => void;
}

export function SuggestionPills({ onSuggestionClick }: SuggestionPillsProps) {
  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick?.(suggestion);
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SUGGESTIONS.map((suggestion, index) => (
        <motion.div
          key={suggestion}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: 0.3 + index * 0.05,
            ease: "easeOut",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSuggestionClick(suggestion)}
            className="rounded-full text-xs font-normal text-muted-foreground/60 hover:bg-accent"
          >
            {suggestion}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}