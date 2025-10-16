"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ChatHeaderProps {
  onOpenChatList: () => void;
}

export function ChatHeader({ onOpenChatList }: ChatHeaderProps) {
  return (
    <div className="fixed top-6 left-6 z-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-pointer transition-opacity hover:opacity-80"
          aria-label="Reset chat"
        >
          <Link href="/">Laburen</Link>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenChatList}
          className="h-8 w-8 p-0"
          aria-label="Open chat list"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}