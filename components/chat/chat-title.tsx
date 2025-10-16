"use client";

import { AnimatePresence, motion } from "motion/react";

export function ChatTitle({
    title,
}: {
    title: string;
}) {


  return (
    <div className="flex items-center justify-center pt-6 pb-4 h-8">
      <AnimatePresence mode="wait">
        {title && (
          <motion.div
            key={title}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="text-xs font-medium text-foreground whitespace-nowrap">
              {title}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}