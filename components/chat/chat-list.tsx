"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Plus, X } from "lucide-react";
import Link from "next/link";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  visibility: string;
}

interface ChatListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentChatId?: string;
  onNewChat: () => void;
}

export function ChatList({
  open,
  onOpenChange,
  currentChatId,
  onNewChat
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchChats();
      setSearchQuery(""); // Reset search when opening
    }
  }, [open, fetchChats]);

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const handleNewChat = () => {
    onNewChat();
    onOpenChange(false); // Close dialog after creating new chat
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between px-3">
            <DialogTitle>Chats</DialogTitle>
            <Button
              onClick={handleNewChat}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Command className="border-0">
          <div className="px-3 py-2">
            <CommandInput
              placeholder="Search chats..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
          </div>
          <CommandList>
            <ScrollArea className="max-h-96">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading chats...
                </div>
              ) : filteredChats.length === 0 ? (
                <CommandEmpty>
                  {searchQuery ? "No chats found." : "No chats yet. Start a new conversation!"}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredChats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/${chat.id}`}
                      onClick={() => onOpenChange(false)} // Close dialog when navigating
                    >
                      <CommandItem
                        value={chat.id}
                        className={cn(
                          "flex items-start gap-3 px-3 py-3 cursor-pointer",
                          currentChatId === chat.id && "bg-accent"
                        )}
                      >
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {chat.title}
                            </p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDate(chat.createdAt)}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
