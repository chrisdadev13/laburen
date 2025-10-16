"use client";

import { useStickToBottomContext } from "use-stick-to-bottom";
import { type ReactElement, cloneElement, useCallback } from "react";
import type { ChatInputMessage } from "./chat-input";

interface ChatInputWrapperProps {
  children: ReactElement;
  onSubmit: (message: ChatInputMessage) => void;
}

/**
 * Wrapper component that accesses StickToBottom context to auto-scroll
 * when user submits a message. This must be rendered inside a StickToBottom provider.
 */
export function ChatInputWrapper({ children, onSubmit }: ChatInputWrapperProps) {
  const { scrollToBottom } = useStickToBottomContext();

  const handleSubmit = useCallback((message: ChatInputMessage) => {
    // Call the original onSubmit first
    onSubmit(message);
    
    // Scroll to bottom after a delay to let the message render
    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    });
  }, [onSubmit, scrollToBottom]);

  // Clone the child element and override its onSubmit
  // biome-ignore lint/suspicious/noExplicitAny: cloneElement requires any for props override
  return cloneElement(children, { onSubmit: handleSubmit } as any);
}
